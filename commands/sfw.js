const { getSFWImage } = require('../utils/waifuim-wrapper');
const { alias } = require('./cobalt-downloader');

module.exports = {
    name: 'getsfw',
    alias: ['sfw', 'waifu', 'waifus'],
    category: 'anime',
    usage: 'getsfw <tags>',
    owner: false,
    description: 'envía una imagen SFW',
    execute: async ({message}) => {
        const sfw = ['waifu', 'maid', 'uniform', 'marin-kitagawa', 'mori-calliope', 'raiden-shogun', 'oppai', 'selfies', 'kamisato-ayaka']
        const errorMessage = `Usa uno de los siguientes:\n${sfw.map(tag => `> ${tag}`).join('\n')}`;
        try {
            if (!message.args || message.args.length === 0) {
                throw new Error('No se proporcionaron tags.\n' + errorMessage);
                }
            const tags = message.args && message.args.length > 0 ? message.args : ['waifu'];
            console.log(tags)
            let res = await getSFWImage(tags);
            await message.reply({ image: { url: res.url }, caption: `source: ${res.source}\ntags: ${res.tags.map(tag => tag.name).join(', ')}\nFecha de subida: ${new Date(res.uploaded_at).toLocaleDateString('es-ES')}`, mimetype: "image/jpeg" });
        } catch (error) {
            throw error;
        }
    },
  };
  