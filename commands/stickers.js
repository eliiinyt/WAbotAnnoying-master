const {createSticker} = require("../libs/stickers")
module.exports = {
    name:"s",
    description:"test",
execute: async ({message}) => {
const [packname, author] = message.body?.split("|");
const mess = message.quoted ?? message;
if (/image/g.test(mess.mimetype)) {
    const buffer = await mess.download();
    const sticker = await createSticker(buffer, null, packname, author);
    return await message.reply({ sticker });
}

if (/webp/g.test(mess.mimetype)) {
    const buffer = await mess.download();
    sticker = await addExif(buffer, packname, author);

}

}
}
