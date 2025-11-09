const { fromBuffer } = require('file-type')
const formData = require('form-data')
/**
 * 
 * @param {Buffer} buffer - image buffer 
 * @returns {Promise<string>} url string
 * @throw {Error}
 */
module.exports = async buffer => {
try {
const { ext } = await fromBuffer(buffer)
let form = new formData
form.append('file', buffer, 'tmp.' + ext )

const res = await fetch('https://telegra.ph/upload', {
    method: 'POST',
    body: form
})
const result = await res.json()
if (result.error) {
    throw new Error(result.error)
}
return `https://telegra.ph${result[0].src}`

} catch(err) {
    throw new Error(`error al subir la imagen: (soy idiota) ${err.message}`)
}
}