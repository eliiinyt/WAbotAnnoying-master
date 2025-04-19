const {createSticker} = require("../libs/stickers")
module.exports = {
    name:"s",
    description:"test",
execute: async ({message}) => {
    try {
        const [packname, author] = message.body?.split("|");
        if (!message.quoted) {
            throw new Error("responde a una imagen o sticker");
        }
        const mess = message.quoted ?? message;
        if (/image/g.test(mess.mimetype)) {
            const buffer = await mess.download("stickers/image");
            const sticker = await createSticker(buffer, null, packname, author);
            return await message.reply({ sticker });
        }
        
        if (/webp/g.test(mess.mimetype)) {
            const buffer = await mess.download("stickers/image");
            sticker = await addExif(buffer, packname, author);
        
        } 
    } catch (error) {
        throw error
    }


}
}
