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
  name: "instagram",
  alias: ["igdl", "cobalt"],
  description: "ig downloader",
  execute: async ({ message, env }) => {
    try {
      const api = new CobaltAPI(
        env.API_URL,
        env.COBALT_API_KEY
      );
      if (!message.args || message.args.length === 0) {
        throw new Error('No se proporcionó un enlace de Instagram.');   
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




// try {

//     let res = await ndown(message.args[0])
//     console.log(res)
//     await message.reply({ video: { url: res.data[0].url }, caption: "test" });
//   } catch (error) {
//       throw error

//   }

// (async () => {
//     const api = new CobaltAPI('http://localhost:9000', 'db50d9a7-d4e3-4e6f-9799-f17215ddff0b');

//     try {
//       const downloadData = {
//         url: 'https://www.instagram.com/p/DISDsZ0yOZi/?utm_source=ig_web_copy_link',
//         videoQuality: '720',
//         audioFormat: 'mp3',
//         filenameStyle: 'basic',
//       };

//       const downloadResponse = await api.processDownload(downloadData);
//       console.log('Download Response:', downloadResponse);

//       const serverInfo = await api.getServerInfo();
//       console.log('Server Info:', serverInfo);

//     } catch (error) {
//         throw error
//     }
//   })();
