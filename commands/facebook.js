const { ndown } = require("nayan-videos-downloader")
module.exports = {
    name: 'facebook',
    description: 'tt downloader',
    execute: async ({message}) => {
      let res = await ndown(message.args[0])
        await message.reply({ video: { url: res.data[0].url }, caption: res.data[0].resolution, mimetype: "video/mp4" });
    },
  };
  