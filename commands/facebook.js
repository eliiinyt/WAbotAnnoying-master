const { ndown } = require("nayan-videos-downloader")
module.exports = {
    name: 'facebook',
    description: 'Facebook downloader',
    execute: async ({message}) => {
      try {
        let res = await ndown(message.args[0])
        await message.reply({ video: { url: res.data[0].url }, caption: res.data[0].resolution, mimetype: "video/mp4" });
      } catch (error) {
        throw error
        
      }
      
    },
  };
  