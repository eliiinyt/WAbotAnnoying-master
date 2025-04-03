const { EventEmitter } = require("events");
const {
  makeWASocket,
  useMultiFileAuthState,
  makeInMemoryStore,
  DisconnectReason,
} = require("baileys");
const pino = require("pino");

class Client extends EventEmitter {
  client;
  store;
  constructor() {
    super();
  }

  async connect() {
    const logger = pino({ level: "silent" });
    this.store = makeInMemoryStore({ logger });
    const { state, saveCreds } = await useMultiFileAuthState("Auth");

    try {
      await this.initSocket(state, logger, saveCreds);
    } catch (e) {
      this.emit("auth_error", e);
    }
  }

  async initSocket(state, logger, saveCreds) {
    this.client = makeWASocket({
      version: [2, 2413, 1],
      printQRInTerminal: true,
      // mobile: false,
      // browser: Browsers.ubuntu('Chrome'),
      auth: state,
      logger,
      getMessage: (key) => {
        if (this.store) {
          const msg = this.store.loadMessage(key.remoteJid, key.id);
          return msg?.message;
        }
        return proto.Message.fromObject({});
      },
    });

    this.store.bind(this.client.ev);

    this.client.ev.on("creds.update", saveCreds);
    this.client.ev.on("connection.update", (update) => this.updateConnection(update));

    try {
      await this.waitForConnection();
    } catch (e) {
      console.error("Fallo al establecer la conexión:", e);
    }
  }

  async waitForConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.client.ev.off("connection.update", checkConnection);
        reject(new Error("Connection timeout!"));
      }, 30000); // 30 seconds timeout

      const checkConnection = ({ connection }) => {
        if (connection === "open") {
          clearTimeout(timeout);
          this.client.ev.off("connection.update", checkConnection);
          resolve();
        } else if (connection === "close") {
          clearTimeout(timeout);
          this.client.ev.off("connection.update", checkConnection);
          reject(new Error("Connection closed"));
        }
      };

      this.client.ev.on("connection.update", checkConnection);
    });
  }

  updateConnection({ connection, lastDisconnect }) {
    if (connection === "close") {
      console.log("Error de conexión:", lastDisconnect?.error);

      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("Reconectando en 5 segundos");
        setTimeout(() => this.connect(), 5000);
      } else {
        console.log("Conexion cerrada");
      }
    } else if (connection === "open") {
      console.log("Connection opened.");

      this.client.ev.on("group-participants.update", (update) =>
        this.emit("participant-update", this.client, update)
      );

      this.client.ev.on("groups.update", (update) =>
        this.emit("group-update", this.client, update)
      );

      this.emit("connection.open");

      this.client.ev.on("messages.upsert", async ({ messages }) => {
        for (const message of messages) {
          if (!message.key.fromMe && message.message) {
            this.emit("message", message);
          };
        };
      });
    };

    this.emit("connection.update", { connection, lastDisconnect });
  }
}

module.exports = Client;
