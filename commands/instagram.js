const { ndown } = require("nayan-videos-downloader")
module.exports = {
    name: 'instagram',
    description: 'ig downloader',
    execute: async ({message}) => {
      let res = await ndown(message.args[0])
        await message.reply({ video: { url: res.data[0].url }, caption: "test", mimetype: "video/mp4" });
    },
  };
  