
const CobaltAPI = require("../tests/cobalt");
const mime = require('mime-types');
const { downloadFile } = require('../utils/functions');
const path = require('path');
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
        audioFormat: "ogg",
        audioBitrate: "256",
        youtubeDubLang: "es-ES",
        videoQuality: message.args[1] ? message.args[1] : "480",
        filenameStyle: "classic",
        youtubeVideoCodec: "h264",
        disableMetadata: true,
        youtubeHLS: false,
        alwaysProxy: true,
      };

      console.log(downloadData)
      const downloadResponse = await api.processDownload(downloadData);
    if (downloadResponse.status === "redirect" || downloadResponse.status === "tunnel") {
      const pathFile = path.join(__dirname, "../", "cache", "youtube", downloadResponse.filename);
      await downloadFile({url: downloadResponse.url, outputPath: pathFile});

          message.reply({
            caption: downloadResponse.filename,
            video: { url: pathFile }, mimetype: "video/mp4"
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