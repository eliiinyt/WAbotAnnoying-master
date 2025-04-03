module.exports = {
    name: 'testfile',
    description: 'sentFileTest',
    execute: async ({message}) => {
    await message.reply({ image: { url: './temp/rikka.png' }, caption: "test", mimetype: "image/jpeg" });
    },
  };
  