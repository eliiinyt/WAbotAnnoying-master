
const CobaltAPI = require("../tests/cobalt");
const mime = require('mime-types');
module.exports = {
  name: "youtube",
  alias: ["youtube", "cobalt"],
  description: "youtube downloader",
  execute: async ({ message, env }) => {
    try {
        console.log(env.API_URL)
      const api = new CobaltAPI(
        env.API_URL,
        env.COBALT_API_KEY
      );
      env.apiURL
      if (!message.args || message.args.length === 0) {
        throw new Error('No se proporcionó un enlace de Instagram.');   
        }
      const downloadData = {
        url: message.args[0],
        videoQuality: message.args[1] || "480p",
        audioFormat: "mp3",
        filenameStyle: "basic",
      };
      const downloadResponse = await api.processDownload(downloadData);

    if (downloadResponse.status === "redirect" || downloadResponse.status === "tunnel") {

          await message.reply({
            caption: downloadResponse.filename,
            video: { url: downloadResponse.url }
          });
      } else if (downloadResponse.status === "error") {
        throw new Error(downloadResponse.message);
      } else {
        throw new Error("Estado inesperado", downloadResponse.status);
      }
    } catch (error) {
      throw error;
    }
}
};