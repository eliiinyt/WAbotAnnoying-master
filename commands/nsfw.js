/* eslint-disable max-len */
/* eslint-disable no-useless-catch */
const { getNSFWImage } = require('../utils/waifuim-wrapper');

module.exports = {
    name: 'getnsfw',
    isNSFW: true,
    description: 'envía una imagen NSFW',
    execute: async ({ message }) => {
        const nsfw = ['ass', 'hentai', 'milf', 'oral', 'paizuri', 'ecchi', 'ero'];
        const errorMessage = `Usa uno de los siguientes:\n${nsfw.map(tag => `> ${tag}`).join('\n')}`;
        try {
            if (!message.args || message.args.length === 0) {
                throw new Error(`No se proporcionaron tags.\n${errorMessage}`);
            }
            const tags = message.args && message.args.length > 0 ? message.args : ['waifu'];
            console.log(tags);
            const res = await getNSFWImage(tags);
            await message.reply({ image: { url: res.url }, caption: `source: ${res.source}\ntags: ${res.tags.map(tag => tag.name).join(', ')}\nFecha de subida: ${new Date(res.uploaded_at).toLocaleDateString('es-ES')}`, mimetype: 'image/jpeg' });
        } catch (error) {
            throw error;
        }
    },
};
