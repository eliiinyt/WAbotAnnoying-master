const { EventEmitter } = require('events');
const {
  makeWASocket,
  useMultiFileAuthState,
  makeInMemoryStore,
  DisconnectReason,
  proto,
} = require('baileys');
const pino = require('pino');
const pretty = require('pino-pretty');
const stream = pretty({
  colorize: true,
  translateTime: true,
  ignore: 'pid,hostname',
});
const CONNECTION_TIMEOUT = 30000;
const RECONNECT_DELAY = 5000;

class Client extends EventEmitter {
  client;
  store;
  logger;

  constructor() {
    super();
    this.logger = pino({ level: 'info'}, stream);
    this.logger.info('Iniciando cliente de WhatsApp');
  }

  async connect() {
    try {
      this.store = makeInMemoryStore({ logger: this.logger });
      const { state, saveCreds } = await useMultiFileAuthState('Auth');
      await this.initSocket(state, saveCreds);
    } catch (error) {
      this.handleError('Autenticación fallida', error);
    }
  }

  async initSocket(state, saveCreds) {
    this.client = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: this.logger,
      getMessage: async (key) => {
        return this.store?.loadMessage(key.remoteJid, key.id)?.message || proto.Message.fromObject({});
      },
    });

    this.setupCoreListeners(saveCreds);
    await this.waitForConnection();
  }

  setupCoreListeners(saveCreds) {
    this.store.bind(this.client.ev);
    this.client.ev.on('creds.update', saveCreds);
    this.client.ev.on('connection.update', (update) => this.handleConnectionUpdate(update));
  }

  async waitForConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanupConnectionListeners(checkConnection);
        reject(new Error(`Tiempo de conexión agotado después de ${CONNECTION_TIMEOUT}ms`));
      }, CONNECTION_TIMEOUT);

      const checkConnection = ({ connection }) => {
        if (connection === 'open') {
          this.cleanupConnectionListeners(checkConnection, timeout);
          resolve();
        } else if (connection === 'close') {
          this.cleanupConnectionListeners(checkConnection, timeout);
          reject(new Error('Conexión cerrada'));
        }
      };

      this.client.ev.on('connection.update', checkConnection);
    });
  }

  cleanupConnectionListeners(listener, timeout) {
    if (timeout) clearTimeout(timeout);
    this.client.ev.off('connection.update', listener);
  }

  handleConnectionUpdate({ connection, lastDisconnect }) {
    if (connection === 'close') {
      this.handleDisconnect(lastDisconnect);
    } else if (connection === 'open') {
      this.handleSuccessfulConnection();
    }

    this.emit('connection.update', { connection, lastDisconnect });
  }

  handleDisconnect(lastDisconnect) {
    this.logger.warn('Conexión cerrada:', lastDisconnect?.error);

    if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      this.logger.info(`Reconectando en ${RECONNECT_DELAY / 1000} segundos...`);
      setTimeout(() => this.connect(), RECONNECT_DELAY);
    } else {
      this.logger.info('Sesión cerrada, no se reconectará.');
    }
  }

  handleSuccessfulConnection() {
    this.setupEventListeners();
    this.emit('connection.open');
  }

  setupEventListeners() {
    this.logger.info('Conexión establecida, configurando listeners de eventos.');

    this.client.ev.on('group-participants.update', (update) =>
      this.emit('participant-update', this.client, update)
    );

    this.client.ev.on('groups.update', (update) =>
      this.emit('group-update', this.client, update)
    );

    this.client.ev.on('messages.upsert', async ({ messages }) => {
      for (const message of messages) {
        if (message.message) {
          this.emit('message', message);
        }
      }
    });
  }

  handleError(context, error) {
    this.logger.error(`${context}:`, error);
    this.emit('error', error);
  }
}

module.exports = Client;
