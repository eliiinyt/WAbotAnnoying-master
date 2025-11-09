
const Client = require("./client");
const client = new Client();

const Init = async () => {
    try {
    console.log("iniciando cliente");
    console.log("client", client);
    client.on("connection.update", (update) => {
        console.log("Connection update:", update);
      });
  
      client.on("connection.open", async () => {
        console.log("Conectado a WhatsApp!");
      });
  
      client.on("message", async (msg) => {
        const message = await processMessage(client.client, msg);
        console.log("Received message:", message);
      });
      client.on("auth_error", (error) => {
        console.error("Authentication error:", error);
      });
  
      client.connect();
    } catch (error) {
        console.error("Error during initialization:", error);
        process.exit(1);
      }
}

Init();



