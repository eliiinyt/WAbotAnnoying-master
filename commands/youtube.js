
const CobaltAPI = require("../tests/cobalt");
const mime = require('mime-types');
module.exports = {
  name: "youtube",
  alias: ["youtube", "cobalt"],
  description: "youtube downloader",
  execute: async ({ message, env }) => {
    try {
      const api = new CobaltAPI(
        env.API_URL,
        env.COBALT_API_KEY
      );
      if (!message.args || message.args.length === 0) {
        throw new Error('No se proporcionó un enlace de youtube.');   
        }
      const downloadData = {
        url: message.args[0],
        videoQuality: message.args[1] ? message.args[1] : "480",
        audioFormat: "mp3",
        filenameStyle: "pretty",
      };

      console.log(downloadData)
      const downloadResponse = await api.processDownload(downloadData);

    if (downloadResponse.status === "redirect" || downloadResponse.status === "tunnel") {

          await message.reply({
            caption: downloadResponse.filename,
            video: { url: downloadResponse.url }, mimetype: "video/mp4"
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