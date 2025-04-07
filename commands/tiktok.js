const { tikdown } = require("nayan-videos-downloader")
module.exports = {
    name: 'tiktok',
    description: 'tt downloader',
    execute: async ({message}) => {
      if (!message.args[0]) return message.reply('Por favor, proporciona un enlace de TikTok')
      let res = await tikdown(message.args[0])
      res = res.data
      if (!res) return message.reply('No se pudo descargar el video')
      await message.reply({ video: { url: res.video }, caption: res.title, mimetype: "video/mp4" });
    },
  };
  