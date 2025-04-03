module.exports = {
    name: 'testfile',
    description: 'sentFileTest',
    execute: async ({message}) => {
        const { getSFWImage } = require('waifu.pics-wrapper');
        let res = await getSFWImage('waifu');
    await message.reply({ image: { url: res }, caption: "test", mimetype: "image/jpeg" });
    },
  };
  