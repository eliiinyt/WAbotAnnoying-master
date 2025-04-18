const Client = require("./client");
const path = require("path");
const CommandLoader = require("./libs/loader");
const client = new Client();
const { processMessage } = require("./utils/serialize");
const watchMessage = require("./utils/watchMessage");
const chokidar = require("chokidar");
const DBManager = require('./utils/dbManager');
const Gachapon = require('./utils/gachapon');
const GPTWrapper = require("./libs/gpt");
const { exec } = require('child_process');
const dotenv = require('dotenv');
dotenv.config();

const logger = client.logger
const model = "DeepSeek-R1-Distill-Qwen-1.5B-Q8_0.gguf";
// 'DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf'; 'gpt4all-falcon-newbpe-q4_0.gguf'
const options = {
  modelPath: "./models/",
  allowDownload: true,
  verbose: true,
  device: "NVIDIA GeForce GTX 1060 6GB",
  nCtx: 700,

  //modelConfigFile: "./models/models3.json",
};

//const gptWrapper = new GPTWrapper(model, options);

const dbManager = new DBManager(process.env.DB_URI, process.env.DB_NAME);
const commandsDir = path.join(__dirname, "commands");
const commandLoader = new CommandLoader(commandsDir);

const loadCommands = (filePath) => {
  console.log(`Se detectó un cambio en el archivo ${filePath}. Recargando comando.`);
  const commandName = path.basename(filePath, ".js");
  commandLoader.loadCommands(commandsDir, commandName);
};


const Init = async () => {
  try {
    await dbManager.connect();
    //await gptWrapper.load();
    chokidar.watch(commandsDir, { ignoreInitial: true })
      .on("change", loadCommands);

    const gachapon = new Gachapon(dbManager);

    exec("node ./cobalt/api/src/cobalt.js", (error, stdout, stderr) => {
      if (error) {
          console.error(`Error: ${error.message}`);
          return;
      }
      if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
      }
      console.log(`stdout: ${stdout}`);
  });
  console.log("Ejecutando API de Cobalt...");

    client.on("connection.update", (update) => {
      console.log("Connection update:", update);
    });

    client.on("connection.open", async () => {
      console.log("Conectado a WhatsApp!");
    });

    client.on("message", async (msg) => {
      if (msg.key.remoteJid === "status@broadcast") return;
      if (process.env.FROM_ME === "false" && msg.key.fromMe) {
        return;
      }
      const message = await processMessage(client.client, msg);
      console.log("debug mode: ", process.env.DEBUG_MODE);

      if (process.env.DEBUG_MODE === "false") {
        logMessage(message);
      } else {
        console.log("Mensaje recibido:", message);
      }

      const senderId = message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1] || null

      if (!senderId) return;
      await dbManager.saveMessage({ msg: message });

      const updatePayload = {
        userId: senderId,
        inc: {
          xp: 10,
          messages_count: 1
        },
        updateGlobal: true,
        globalInc: {
          total_messages: 1
        }
      };

    //const watch = watchMessage(client, processMessage);


      if (message.prefix) {
        const command = commandLoader.getCommand(message.command);

        if (command) {
          try {
            await message.react("✅");
            await command.execute({
              message,
              dbManager,
              //gptWrapper,
              gachapon, 
              env: process.env,
              //watch,
            });
          } catch (error) {
            console.error("Error ejecutando comando:", error);
            await message.react("💀");
            await message.reply("Error: " + error.message);
          }

          updatePayload.inc.commands_count = 1;
          updatePayload.globalInc.total_commands = 1;
        }
      }
      await dbManager.updateUserData(updatePayload);



    });

    client.on("auth_error", (error) => {
      console.error("Authentication error:", error);
    });

    client.connect();

  } catch (error) {
    console.error("Error during initialization:", error);
    process.exit(1);
  }
};

Init();


const logMessage = (message) => {
  if (!message) return;

  switch (message.type) {
    case 'imageMessage':
      logger.info({
        url: message.message.url,
        mimetype: message.message.mimetype,
        height: message.message.height,
        width: message.message.width,
        chat: message.chat,
        sender: message.sender,
        name: message.name,
        quoted: message.quoted,
        command: message.command,
        prefix: message.prefix,
        mentions: message.mentions,
        mimetype: message.mimetype,
      }, 'Mensaje de imagen recibido');
      break;

    case 'conversation':
      case 'extendedTextMessage':
      logger.info({
        body: message.body,
        chat: message.chat,
        key: message.key,
        body: message.body,
        args: message.args,
        mentions: message.mentions,
        mimetype: message.mimetype,
        sender: message.sender,
        name: message.name,
        quoted: message.quoted,
        command: message.command,
        prefix: message.prefix,
      }, 'Mensaje de texto recibido');
      break;

    case 'audioMessage':
      logger.info({
        url: message.message.url,
        mimetype: message.message.mimetype,
        chat: message.chat,
        sender: message.sender,
        name: message.name,
        quoted: message.quoted,
        command: message.command,
        prefix: message.prefix,
        mentions: message.mentions,
        mimetype: message.mimetype,
      }, 'mensaje de audio recibido');
      break;

    case 'videoMessage':
      logger.info({
        chat: message.chat,
        url: message.message.url,
        mimetype: message.mimetype,
        height: message.message.height,
        width: message.message.width,
        sender: message.sender,
        name: message.name,
        quoted: message.quoted,
        command: message.command,
        prefix: message.prefix,
        mentions: message.mentions,
        mimetype: message.mimetype,
      }, 'Mensaje de video recibido');
      break;

    default:
      logger.info(message, 'Tipo de mensaje desconocido recibido');
      break;
  }
};
