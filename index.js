const { Client } = require('./client');
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const CommandLoader = require('./libs/loader');
const client = new Client();
const { processMessage } = require('./utils/serialize');
const chokidar = require('chokidar');
const DBManager = require('./utils/dbManager');
const Gachapon = require('./utils/gachapon');
const GPTWrapper = require('./libs/gpt');
const ConfigManager = require('./utils/configManager');
const downloaderCommand = require('./commands/downloader');
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');
const fs = require('fs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/config', (req, res) => {
  res.json({ currentDir: __dirname });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === process.env.EMAIL) {
      const match = await bcrypt.compare(password, process.env.PASSWORD_HASH);
      if (match) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'Contraseña incorrecta' });
      }
    } else {
      res.json({ success: false, message: 'Usuario incorrecto' });
    }
  } catch (error) {
    console.error('Error al procesar el login:', error);
    res
      .status(500)
      .json({ success: false, message: 'Error interno del servidor' });
  }
});

const PORT = process.env.PORT || 3000;
const gptWrapper = new GPTWrapper(process.env.GEMINI_API_KEY);
const dbManager = new DBManager(process.env.DB_URI, process.env.DB_NAME);
const commandsDir = path.join(__dirname, 'commands');
const commandLoader = new CommandLoader(commandsDir);
const ignoredGroups = (process.env.IGNORED_GROUPS || '').split(',');

const loadCommands = (filePath) => {
  console.log(
    `Se detectó un cambio en el archivo ${filePath}. Recargando comando.`
  );
  const commandName = path.basename(filePath, '.js');
  commandLoader.loadCommands(commandsDir, commandName);
};



const Init = async () => {
  try {
    await dbManager.connect();
    // await gptWrapper.load();

    chokidar
      .watch(commandsDir, { ignoreInitial: true })
      .on('change', loadCommands);

    const gachapon = new Gachapon(dbManager);

    console.log('Ejecutando API de Cobalt...');

    http.listen(PORT, () => {
      console.log(`Servidor web funcionando en el puerto: ${PORT}`);
    });

    io.on('connection', (socket) => {
      console.log('Un cliente web se ha conectado');

      socket.on('reply', (data) => {
        try {
          if (data.chatId && data.replyMessage) {
            client.client.sendMessage(data.chatId, { text: data.replyMessage });
          }
        } catch (error) {
          console.error('Error al enviar la respuesta desde la web:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('Un cliente web se ha desconectado');
      });
    });

    client.on('connection.update', (update) => {
      console.log('Connection update:', update);
    });

    client.on('connection.open', async () => {
      console.log('Conectado a WhatsApp!');
    });

    client.on('group-participants.update', async (update) => {
      const { id, participants, action } = update;
      console.log(id, participants, action);
    });

    client.on('groups.update', async (update) => {
      console.log(update);
    });

    client.on('message', async (msg) => {
      if (msg.key.remoteJid === 'status@broadcast') return;
      if (process.env.FROM_ME === 'false' && msg.key.fromMe) {
        return;
      }

      const message = await processMessage(client.client, msg);
      if (process.env.DEBUG_MODE === 'false') {
        logMessage(message, io).catch(console.error);
      } else {
        console.log('Mensaje recibido:', message);
      }

      const senderId =
        message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1] ||
        message.sender.match(/^(\d+)@lid$/)?.[1] ||
        null;
      if (!senderId) return;

      await dbManager.saveMessage({ msg: message });

      const updatePayload = {
        userId: senderId,
        inc: {
          xp: 10,
          messages_count: 1,
        },
        updateGlobal: true,
        globalInc: {
          total_messages: 1,
        },
      };

      if (ignoredGroups.includes(message.chat)) {
        return;
      }


      //autodescargas NO tocar (de verdad por favor esto fue innecesario)
      const configManager = new ConfigManager(path.join(__dirname, 'config.json'));
      const groupConfig = configManager.getGroupConfig(message.chat);

      if (groupConfig.autodownload) {
        const supportedDomains = [
          /(?:https?:\/\/)?(?:www\.|web\.|m\.)?(facebook\.com|fb\.watch)\/[^\s]+/i,
          /(?:https?:\/\/)?(?:www\.)?(instagram\.com|instagr\.am)\/[^\s]+/i,
          /(?:https?:\/\/)?(?:www\.|vm\.|vt\.)?tiktok\.com\/[^\s]+/i
        ];

        let match;
        for (const regex of supportedDomains) {
          const found = message.body.match(regex);
          if (found) {
            match = found[0];
            break;
          }
        }
        
        if (match) {
           const url = match;
           console.log('Autodescargas fue activada para:', url);
           
           const mockMessage = { ...message, args: [url], reply: message.reply.bind(message) };
           
           try {
            await message.react('✅');
             await downloaderCommand.execute({
                message: mockMessage,
                env: process.env
             });
           } catch (error) {
            await message.react('❌');
             console.error('Autodescargas falló:', error.message);
           }
        }
      }

      if (!message.prefix || !message.command) {
        await dbManager.updateUserData(updatePayload);
        return;
      }

      const command = commandLoader.getCommand(message.command);

      if (!command) {
        await dbManager.updateUserData(updatePayload);
        return;
      }

      try {
        if (command.isOwner === true && message.sender !== process.env.OWNER) {
          console.warn('Intento de uso de comando restringido:', message.sender);
          await message.react('❌');
          return message.reply('Error: No tienes permiso para usar este comando.');
        }

        if (command.isNSFW && process.env.NSFW !== 'true') {
          console.warn('Intento de uso de comando NSFW:', message.sender);
          await message.react('❌');
          return message.reply('Error: No están permitidos los comandos NSFW.');
        }

        if (command?.react === true || command?.react === null || command?.react === undefined) {
          await message.react('✅');
        }
        console.log('Ejecutando comando:', command.name);
        await command.execute({
          message,
          dbManager,
          gptWrapper,
          gachapon,
          env: process.env,
        });

        updatePayload.inc.commands_count = 1;
        updatePayload.globalInc.total_commands = 1;

      } catch (error) {
        console.error('Error ejecutando comando:', error);
        await message.react('💀');
        message.reply(`Error: ${error.message}`);
      }

      await dbManager.updateUserData(updatePayload);
    });

    client.on('auth_error', (error) => {
      console.error('Authentication error:', error);
    });

    client.connect();
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
};

const logMessage = async (message, socketIo) => {
  if (!message) return;
  try {
    const {
      quoted,
      type,
      chat,
      sender,
      name,
      command,
      prefix,
      mentions,
      body,
      args,
      key,
      message: msg,
    } = message;

    let multimedia = null;
    const mediaTypes = [
      'imageMessage',
      'audioMessage',
      'videoMessage',
      'stickerMessage',
    ];

    if (mediaTypes.includes(type) && typeof message.download === 'function') {
      const mimeType = msg?.mimetype || 'application/octet-stream';
      const extension = mimeType.split('/')[1] || 'bin';
      const mediaDir = path.join(__dirname, 'public', 'media', type);
      const mediaPath = path.join(mediaDir, `${key.id}.${extension}`);
      
      fs.mkdirSync(mediaDir, { recursive: true });
      await message.download(mediaPath);
      
      multimedia = `/media/${type}/${key.id}.${extension}`;
      console.log(`Archivo descargado (${type}), guardado en: ${multimedia}`);
      
    }

    const quotedMessage = quoted ? {
      type: quoted.type,
      body: quoted.body,
      caption: quoted.caption,
      mentions: quoted.mentions,
      args: quoted.args,
      url: quoted.message?.[quoted.type]?.url,
      mimetype: quoted.message?.[quoted.type]?.mimetype,
      height: quoted.message?.[quoted.type]?.height,
      width: quoted.message?.[quoted.type]?.width,
      seconds: quoted.message?.[quoted.type]?.seconds,
    } : null;

    const baseLog = {
      id: key.id,
      body,
      chat,
      sender,
      senderLid: key.senderLid,
      senderPn: key.senderPn,
      participantLid: key.participantLid,
      participantPn: key.participantPn,
      name,
      command,
      prefix,
      mentions,
      quoted: quotedMessage,
      multimedia
    };

    const typeMap = {
      imageMessage: {
        label: 'Mensaje de imagen recibido',
        extra: {
          url: msg?.url,
          mimetype: msg?.mimetype,
          height: msg?.height,
          width: msg?.width,
        },
      },
      audioMessage: {
        label: 'Mensaje de audio recibido',
        extra: {
          url: msg?.url,
          mimetype: msg?.mimetype,
          seconds: msg?.seconds,
        },
      },
      reactionMessage: {
        label: 'Mensaje de reacción recibido',
      },
      stickerMessage: {
        label: 'Mensaje de sticker recibido',
        extra: {
          url: msg?.url,
          mimetype: msg?.mimetype,
          height: msg?.height,
          width: msg?.width,
        },
      },
      videoMessage: {
        label: 'Mensaje de video recibido',
        extra: {
          url: msg?.url,
          mimetype: msg?.mimetype,
          height: msg?.height,
          width: msg?.width,
          seconds: msg?.seconds,
        },
      },
      protocolMessage: {
        label: 'Mensaje de protocol recibido',
        extra: {
          key,
          args,
          type: (() => {
            const protocolType = msg?.protocolMessage?.type;
            const entries = Object.entries(msg?.protocolMessage || {});
            const foundEntry = entries.find(
              ([key, value]) =>
                key !== 'type' && key !== 'key' && typeof value === 'object'
            );

            if (protocolType === 14 && foundEntry) {
              return {
                id: 14,
                description: 'Edición de mensaje',
                new_message: msg?.protocolMessage?.editedMessage?.conversation,
              };
            }
            if (foundEntry) {
              const [propertyName, propertyValue] = foundEntry;
              return `Propiedad: ${propertyName}, Tipo: ${protocolType}, propiedad: ${propertyValue}`;
            } else {
              return `Mensaje desconocido, type: ${protocolType}`;
            }
          })(),
        },
      },
      conversation: {
        label: 'Mensaje de texto recibido',
        extra: { key, args },
      },
      extendedTextMessage: {
        label: 'Mensaje de texto recibido',
        extra: { key, args },
      },
      editedMessage: {
        label: 'Mensaje editado recibido',
        extra: {
          key,
          args,
          type: type,
          description: 'Edición de mensaje',
          new_message:
            message?.message?.message?.protocolMessage?.[type]?.conversation,
        },
      },
    };

    const config = typeMap[type];
    let logEntry = baseLog;
    let label = 'Mensaje desconocido recibido';

    if (config || type) {
      logEntry = { ...baseLog, ...config?.extra };
      label = config?.label || `Mensaje de tipo ${type} recibido`;
    }

    console.info(label, logEntry);
    socketIo.emit('newLog', logEntry);

  } catch (error) {
    console.error('Error al registrar el mensaje:', error, 'Mensaje:', message);
  }
};

Init();