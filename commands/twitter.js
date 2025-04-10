const { twitterdown} = require("nayan-videos-downloader")
module.exports = {
    name: 'twitter',
    description: 'twitter downloader',
    execute: async ({message}) => {
      try {
      if (!message.args[0]) throw new Error('Por favor, proporciona un enlace de Twitter')
      let res = await twitterdown(message.args[0])
      if (!res.data) throw new Error('No se encontró el video')
      res = res.data["HD"]
      await message.reply({ video: { url: res }, caption: "test", mimetype: "video/mp4" });
      } catch (error) {
        throw error
      }
    },
  };
  