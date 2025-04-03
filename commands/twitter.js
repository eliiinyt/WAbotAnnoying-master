const { twitterdown} = require("nayan-videos-downloader")
module.exports = {
    name: 'twitter',
    description: 'twitter downloader',
    execute: async ({message}) => {
      let res = await twitterdown(message.args[0])
      console.log(res)
      res = res.data["HD"]
        await message.reply({ video: { url: res }, caption: "test", mimetype: "video/mp4" });
    },
  };
  