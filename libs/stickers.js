
const { Sticker } = require("wa-sticker-formatter");


async function createSticker(img, url, packName, authorName, quality = 50) {
	let stickerMetadata = {
		type: 'full',
		pack: packName || "Stickers",
		author: authorName || "undefined",
		quality
	}
	return (new Sticker(img ? img : url, stickerMetadata)).toBuffer()
}


module.exports = { createSticker }
