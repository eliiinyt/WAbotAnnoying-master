const CobaltAPI = require("../tests/cobalt");
const mime = require('mime-types');

    function determineMediaType(filename) {
      const mimeType = mime.lookup(filename);
      if (mimeType.startsWith('image/')) {
        return 'image';
      } else {
        return 'video';
      }
    }

module.exports = {
  name: "tiktok",
  alias: ["tiktok", "cobalt"],
  description: "tiktok downloader",
  execute: async ({ message, env }) => {
    try {
      const api = new CobaltAPI(
        env.API_URL,
        env.COBALT_API_KEY
      );
      if (!message.args || message.args.length === 0) {
        throw new Error('No se proporcionó un enlace de Tiktok.');   
        }
      const downloadData = {
        url: message.args[0],
        videoQuality: "720",
        audioFormat: "mp3",
        filenameStyle: "basic",
      };
      const downloadResponse = await api.processDownload(downloadData);
      if (downloadResponse.status === "picker") {
        console.log(downloadResponse.picker);
        let i = 0;
        for (const item of downloadResponse.picker) {
          const mediaType = item.type === 'photo' ? 'image' : 'video';
          await message.reply({
            caption: `*${i + 1}* ${item.title || ''}`,
            [mediaType]: { url: item.url }
          });
          i++;
        }
      } else if (downloadResponse.status === "redirect" || downloadResponse.status === "tunnel") {
        const mediaType = determineMediaType(downloadResponse.filename);
        console.log(mediaType)
        console.log(downloadResponse.filename)
        if (mediaType) {
          await message.reply({
            caption: downloadResponse.filename,
            [mediaType]: { url: downloadResponse.url }
          });
        } else {
          throw new Error('Tipo de archivo no soportado: ' + downloadResponse.filename);
        }
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