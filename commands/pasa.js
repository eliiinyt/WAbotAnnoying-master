const fs = require('fs');
module.exports = {
  name: 'pasa',
  react: 'false',
  description: 'Te pasa el video del estado seleccionado!',
  execute: async ({ message }) => {
    try {
      const mess = message.quoted || message;
      const messDownload = await mess.download('testing');
      if (messDownload === null || !messDownload.buffer) {
        throw new Error('No se pudo descargar el video o el mensaje citado no contiene ningún video.');
      }
      const { buffer, extension, filePath, fileInfo } = { buffer: messDownload.buffer, extension: messDownload.ext, filePath: messDownload.filename, fileInfo: messDownload.fileInfo };

      fs.writeFileSync(filePath, buffer);
      const fileName = filePath.split('/').pop();
      console.log(`Archivo guardado en: ${filePath}`);
      console.log(`tipo de archivo: ${fileInfo ? fileInfo.ext : 'desconocido'}`);
      console.log(`extension: ${extension}`);
      const mediaKey = mess.mimetype.startsWith('image/') ? 'image' : 'video';
      console.log(`mediaKey: ${mediaKey}`);
      await message.reply({ caption: fileName, [mediaKey]: { url: filePath } });

    } catch (error) {
      throw new Error(`hubo un error al procesar el mensaje: ${error.message}`);
    }
  },
};
