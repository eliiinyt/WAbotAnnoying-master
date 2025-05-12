const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'testw',
    description: 'pong',
    execute: async ({message}) => {
      try {
        const genId = () => Date.now().toString(35) + Math.random().toString(36).slice(2)
        let mess = message.quoted || message
        const messdownload = await mess.download();
        const filePath = path.join(__dirname, '../cache/testing/', `${genId()}.jpg`);
        fs.writeFileSync(filePath, messdownload);
        message.reply({ image: { url: filePath }, caption: "e", mimetype: "image/jpeg" });
      } catch (error) {
        throw new Error('Error al descargar el mensaje: ' + error.message);
      }
      
      

    },
  };
  