const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Descarga un archivo desde una URL y lo guarda en el sistema de archivos, porque me daba problemas todo d.
 * @param {string} url - URL del archivo a descargar, claramente, ¿No?
 * @param {string} outputPath - Ruta donde se guarda el archivo, es absoluta porque se me canta del culo, a llorar a la llorería con path.join
 * @returns {Promise<void>} - Promesa que se resuelve al completar la descarga, btw void XJKDHDHDHJKDKHAKDJHSKLDAS.
 */
async function downloadFile({url, outputPath}) {
  if (typeof url !== 'string' || typeof outputPath !== 'string') {
    throw new TypeError('La URL y la ruta de salida deben ser strings.');
  }

  const directory = path.dirname(outputPath);

  try {
    await fs.promises.mkdir(directory, { recursive: true });

    const response = await axios.get(url, { responseType: 'stream' });

    if (response.status !== 200) {
      throw new Error(`Error al descargar el archivo. Código de estado HTTP: ${response.status}`);
    }

    const fileStream = fs.createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
      response.data.pipe(fileStream);

      fileStream.on('finish', resolve);
      fileStream.on('error', (streamError) => {
        fs.unlink(outputPath, () => {
          reject(new Error(`Error al escribir el archivo: ${streamError.message}`));
        });
      });

      response.data.on('error', (responseError) => {
        fileStream.destroy();
        fs.unlink(outputPath, () => {
          reject(new Error(`Error en el stream de respuesta: ${responseError.message}`));
        });
      });
    });

  } catch (error) {
    console.error(`Fallo en la descarga del archivo desde ${url}:`, error.message);
    throw error;
  }
}

module.exports = { downloadFile };
