const { tikdown } = require("nayan-videos-downloader")
module.exports = {
    name: 'tiktok',
    description: 'tt downloader',
    execute: async ({message}) => {
      try {
      if (!message.args[0]) throw new Error('Por favor, proporciona un enlace de TikTok')
      let res = await tikdown(message.args[0])
      if (!res.data) throw new Error('No se encontró el video')
      await message.reply({ video: { url: res.data.video }, caption: res.data.title, mimetype: "video/mp4" });
    } catch (error) {
      throw error
    }
  }
  };