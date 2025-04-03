const { tikdown } = require("nayan-media-downloader")
module.exports = {
    name: 'tiktok',
    description: 'tt downloader',
    execute: async ({message}) => {
      let res = await tikdown(message.args[0])
      console.log(res)
      res = res.data
        await message.reply({ video: { url: res.video }, caption: res.title, mimetype: "video/mp4" });
    },
  };
  