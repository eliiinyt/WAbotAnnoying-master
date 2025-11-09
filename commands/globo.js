const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    name: 'globo',
    description: 'crea un globo de texto con una imagen',
    execute: async ({ message }) => {
        try {

            const mess = message.quoted || message;
            const bufferImage = await mess.download('globo/image');
            const image = await loadImage(bufferImage.filename);
            const globo = await loadImage(path.join(__dirname, '../cache/globo/globo.png'));

            const canvas = createCanvas(image.width, image.height + (image.height / 4));
            const ctx = canvas.getContext('2d');

            ctx.drawImage(image, 0, image.height / 4, image.width, image.height);
            ctx.drawImage(globo, 0, 0, image.width, image.height / 4);

            const buffer = canvas.toBuffer('image/png');
            await message.reply({ image: buffer, caption: '', mimetype: 'image/png' });
        } catch (error) {
            throw new Error(error.message || 'Error al crear el globo de texto');
        }
    }
};