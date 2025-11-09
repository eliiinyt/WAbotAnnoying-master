module.exports = {
    name: 'asd',
    description: 'sentFileTest',
    execute: async ({message}) => {
    await message.reply({ video: { url: './cache/youtube/tiktok_cancri_e_7496968565468220690.mp4' }, caption: "test", mimetype: "video/mp4" });
    },
  };
  