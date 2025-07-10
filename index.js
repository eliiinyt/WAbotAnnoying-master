const Client = require('./client');
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const CommandLoader = require('./libs/loader');
const client = new Client();
const { processMessage } = require('./utils/serialize');
const watchMessage = require('./utils/watchMessage');
const chokidar = require('chokidar');
const DBManager = require('./utils/dbManager');
const Gachapon = require('./utils/gachapon');
const GPTWrapper = require('./libs/gpt');
const { exec } = require('child_process');
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');

const logger = client.logger;
const model = 'DeepSeek-R1-Distill-Qwen-1.5B-Q8_0.gguf';
// 'DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf'; 'gpt4all-falcon-newbpe-q4_0.gguf'
const options = {
  modelPath: './models/',
  allowDownload: true,
  verbose: true,
  device: 'NVIDIA GeForce GTX 1060 6GB',
  nCtx: 700,

  //modelConfigFile: "./models/models3.json",
};

//const gptWrapper = new GPTWrapper(model, options);

const dbManager = new DBManager(process.env.DB_URI, process.env.DB_NAME);
const commandsDir = path.join(__dirname, 'commands');
const commandLoader = new CommandLoader(commandsDir);

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
      // bcrypt.compare(password, process.env.PASSWORD_HASH).then((match) => {
      if (password === process.env.PASSWORD) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'Contraseña incorrecta' });
      }
      //   })
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

http.listen(PORT, () => {
  console.log(`debería funcionar en el puerto: ${PORT}`);
});

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
    //await gptWrapper.load();
    chokidar
      .watch(commandsDir, { ignoreInitial: true })
      .on('change', loadCommands);

    const gachapon = new Gachapon(dbManager);


    console.log('Ejecutando API de Cobalt...');

    client.on('connection.update', (update) => {
      console.log('Connection update:', update);
    });

    client.on('connection.open', async () => {
      console.log('Conectado a WhatsApp!');
    });

    client.on('message', async (msg) => {
      if (msg.key.remoteJid === 'status@broadcast') return;
      if (process.env.FROM_ME === 'false' && msg.key.fromMe) {
        return;
      }
      const message = await processMessage(client.client, msg);
      console.log('debug mode: ', process.env.DEBUG_MODE);

      if (process.env.DEBUG_MODE === 'false') {
        logMessage(message);
      } else {
        console.log('Mensaje recibido:', message);
      }

      const senderId =
        message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1] || null;
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

      io.on('connection', (socket) => {
        console.log('Un cliente se ha conectado');

        socket.on('reply', (data) => {
          try {
            message.sendMessage(data.log.chat, data.replyMessage);
          } catch (error) {
            console.error('Error al enviar la respuesta:', error);
          }
        });

        socket.on('disconnect', () => {
          console.log('Un cliente se ha desconectado');
        });
      });

      //const watch = watchMessage(client, processMessage);

      if (!message.prefix) {
        return;
      }
      if (!message.command) {
        return;
      }
      const command = commandLoader.getCommand(message.command);

      if (!command) {
        return;
      }
      try {
        if (command.isOwner === true && message.sender !== process.env.OWNER) {
          await message.react('❌');
          return message.reply('Error: No tienes permiso para usar este comando.');
        }
        console.log('Comando:', command);
        if (command.isNSFW && process.env.NSFW !== 'true') {
          await message.react('❌');
          return message.reply('Error: No están permitidos los comandos NSFW.');
        }
        await message.react('✅');
        await command.execute({
          message,
          dbManager,
          //gptWrapper,
          gachapon,
          env: process.env,
          //watch,
        });
      } catch (error) {
        console.error('Error ejecutando comando:', error);
        await message.react('💀');
        message.reply(`Error: ${error.message}`);
      }

      updatePayload.inc.commands_count = 1;
      updatePayload.globalInc.total_commands = 1;
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

const logMessage = async (message) => {
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
    if (
      type === 'imageMessage' ||
      type === 'audioMessage' ||
      type === 'videoMessage' ||
      type === 'stickerMessage'
    ) {
      if (message && typeof message.download === 'function') {
        const buffer = await message.download('../public/res/test');
        console.log(buffer);
        console.log(`Archivo descargado (${type}), tamaño: ${buffer.buffer.length} bytes`);
        multimedia = buffer;
      } else {
        console.warn('Método download() no está disponible en el objeto message.');
      }
    }
    const quotedMessage = quoted ? {
      type: quoted.type,
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
      body,
      chat,
      sender,
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
    if (config || type) {
      const logEntry = { ...baseLog, ...config?.extra };
      console.info(config?.label, { ...baseLog, ...config?.extra });
      io.emit('newLog', logEntry);
    } else {
      console.info('Tipo de mensaje desconocido recibido', message);
    }
  } catch (error) {
    console.error('Error al registrar el mensaje:', error, 'Mensaje:', message);
  }
};

Init();
