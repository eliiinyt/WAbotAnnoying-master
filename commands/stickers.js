const { createSticker, addExif } = require('../libs/stickers');
module.exports = {
    name: 's',
    description: 'test',
    execute: async ({ message }) => {
        const [packname, author] = [message.args[0] ? message.args[0] : 'Stickers', message.args[1] ? message.args[1] : 'testing'];
        if (!message.quoted && !message) {
            throw new Error('responde a una imagen o sticker');
        }
        const mess = message.quoted || message;
        if (/image/g.test(mess.mimetype)) {
            const buffer = await mess.download('stickers/image');
            const sticker = await createSticker(buffer.buffer, null, packname, author);
            return await message.reply({ sticker });
        }
        if (/webp/g.test(mess.mimetype)) {
            const buffer = await mess.download('stickers/image');
            const sticker = await addExif(buffer.buffer, packname, author);
            return await message.reply({ sticker });
        }
    }
};
