const { getSFWImage } = require('../utils/waifuim-wrapper');

module.exports = {
    name: 'getsfw',
    description: 'Get SFW Image',
    execute: async ({message}) => {
        try {
        let res = await getSFWImage('waifu');
    await message.reply({ image: { url: res.url }, caption: `source: ${res.source}\ntags: ${res.tags.map(tag => tag.name).join(', ')}\nFecha de subida: ${new Date(res.uploaded_at).toLocaleDateString('es-ES')}`, mimetype: "image/jpeg" });
        } catch (error) {
            throw error;
        }
    },
  };
  