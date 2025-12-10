const { createSticker, videoToWebp } = require('../libs/stickers'); 

module.exports = {
    name: 's',
    description: 'Crea stickers de imagen o video',
    execute: async ({ message }) => {
        const [packname, author] = [message.args[0] ?? 'Stickers', message.args[1] ?? 'Bot'];
        
        if (!message.quoted && !message) {
            throw new Error('Responde a una imagen o video.');
        }
        
        const mess = message.quoted || message;
        const mime = mess.mimetype || '';

        const mediaObject = await mess.download(); 
        
        const buffer = Buffer.from(mediaObject.buffer); 

        if (/image/g.test(mime) && !/gif/g.test(mime)) {
            try {
                const sticker = await createSticker(buffer, null, packname, author);
                return await message.reply({ sticker });
            } catch (e) {
                console.error(e);
                return message.reply("Error al crear sticker.");
            }
        }
        else if (/video/g.test(mime) || /gif/g.test(mime)) {
            if ((mess.msg || mess).seconds > 8) return message.reply("Máximo 8 segundos.");
            
            try {
                const webpBuffer = await videoToWebp(buffer);
                const sticker = await createSticker(webpBuffer, null, packname, author);
                return await message.reply({ sticker });
            } catch (e) {
                console.error(e);
                return message.reply("Error al procesar el video.");
            }
        }
        else if (/webp/g.test(mime)) {
             const sticker = await createSticker(buffer, null, packname, author);
             return await message.reply({ sticker });
        }
    }
};