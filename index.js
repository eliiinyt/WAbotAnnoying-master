const Client = require("./client");
const path = require("path");
const CommandLoader = require("./libs/loader");
const client = new Client();
const config = require('./config');
const { processMessage } = require("./utils/serialize");
const chokidar = require("chokidar");
const DBManager = require('./utils/dbManager');
const Gachapon = require('./utils/gachapon');
const GPTWrapper = require("./libs/gpt");

const model =    "DeepSeek-R1-Distill-Qwen-1.5B-Q8_0.gguf";  
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

const dbManager = new DBManager(config.dbUri, config.dbName);
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

    client.on("connection.update", (update) => {
      console.log("Connection update:", update);
    });

    client.on("connection.open", async () => {
      console.log("Conectado a WhatsApp!");
    });

    client.on("message", async (msg) => {
      const message = await processMessage(client.client, msg);
      console.log("Received message:", message);


    
      const senderId = message.sender.match(/^(\d+)@s\.whatsapp\.net$/)?.[1] || null
      if (senderId) {
        await dbManager.updateUserXp({ userId: senderId, xpToAdd: 10});
        await dbManager.saveMessage({msg: message});
        await dbManager.updateUserStats({ userId: senderId, type: "message"});
        await dbManager.updateGlobalStats({ type: "message" });
      }
      

      if (!message.prefix) return;

      const command = commandLoader.getCommand(message.command);

      if (!command) return;

      const watchMessage = (filter, options = {}) => {
        return new Promise((resolve, reject) => {
          const { time = 10000, max = 1 } = options;
          let collectedMessages = [];

          const messageListener = async (newMsg) => {
            const newMessage = await processMessage(client.client, newMsg);
            console.log("New message:", newMessage.sender, newMessage.body);
            console.log(filter, " equal ",newMessage.sender)
            if (filter === newMessage.sender) {
              collectedMessages.push(newMessage);
              if (collectedMessages.length >= max) {
                cleanup();
                resolve(collectedMessages);
              }
            }
          };

          const cleanup = () => {
            client.off('message', messageListener);
            clearTimeout(timeout);
          };

          const timeout = setTimeout(() => {
            cleanup();
            if (collectedMessages.length === 0) {
              reject('No messages collected within the time limit.');
            } else {
              resolve(collectedMessages);
            }
          }, time);

          client.on('message', messageListener);
        });
      };

      try {

        await command.execute({
          message,
          dbManager,
         // gptWrapper,
          gachapon,
          watchMessage,
        });

        await dbManager.updateUserStats({userId: senderId, type: "command"})
        await dbManager.updateGlobalStats({type: "command"});

      } catch (error) {
        await dbManager.updateGlobalStats({type: "error"});
        console.error("Error ejecutando comando: ", error);
        await message.react("💀");
        await message.reply("Error:" + error);
      }
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
