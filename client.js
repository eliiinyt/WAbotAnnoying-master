const { EventEmitter } = require('events');
const NodeCache = require('node-cache');
const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  proto,
} = require('baileys');

const pino = require('pino');
const pretty = require('pino-pretty');
const QRCode = require('qrcode');

const stream = pretty({
  colorize: true,
  translateTime: true,
  ignore: 'pid,hostname',
});

const CONNECTION_TIMEOUT = 30000;
const RECONNECT_DELAY = 5000;
const groupCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

class Client extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.logger = pino({ level: 'info' }, stream);
    this.logger.info('Iniciando cliente de WhatsApp');
    this.connectionPromise = null;
    this.connectionResolve = null;
    this.connectionReject = null;
    this.timeout = null;
  }

  async connect() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('Auth');
      await this.initSocket(state, saveCreds);
    } catch (error) {
      this.handleError('Autenticación fallida', error);
    }
  }

  async initSocket(state, saveCreds) {
    this.client = makeWASocket({
      auth: state,
      logger: this.logger,
      version: [2, 3000, 1025190524],
      getMessage: async () => {
        return proto.Message.fromObject({});
      },
      cachedGroupMetadata: async (jid) => {
        return groupCache.get(jid);
      },
    });

    this.setupCoreListeners(saveCreds);
    await this.waitForConnection();
  }

  setupCoreListeners(saveCreds) {
    this.client.ev.on('creds.update', saveCreds);
    this.client.ev.on('connection.update', (update) => this.handleConnectionUpdate(update));
  }

  waitForConnection() {
    this.connectionPromise = new Promise((resolve, reject) => {
      this.connectionResolve = resolve;
      this.connectionReject = reject;

      this.timeout = setTimeout(() => {
        this.cleanupConnectionListeners();
        reject(new Error(`Tiempo de conexión agotado después de ${CONNECTION_TIMEOUT}ms`));
      }, CONNECTION_TIMEOUT);
    });

    return this.connectionPromise;
  }

  cleanupConnectionListeners() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (connection === 'close') {
      this.handleDisconnect(lastDisconnect);
    } else if (connection === 'open') {
      this.cleanupConnectionListeners();
      this.connectionResolve();
      this.handleSuccessfulConnection();
    }

    if (qr) {
      QRCode.toString(qr, { type: 'terminal' }, (err, qrString) => {
        if (err) {
          this.logger.error('Error al generar el código QR:', err);
        } else {
          console.log(qrString);
        }
      });
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
      this.emit('participant-update', update)
    );

    this.client.ev.on('groups.update', async (updates) => {
      this.emit('groups.update', updates);
      // for (const update of updates) {
      //   const groupId = update.id;
      //   const groupMetadata = await this.client.groupMetadata(groupId);
      //   groupCache.set(groupId, groupMetadata);
      // }
    });
    this.client.ev.on('group-participants.update', async (participants) => {
      this.emit('group-participants.update', participants);
    });


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

module.exports = { Client, groupCache };
