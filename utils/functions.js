const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Descarga un archivo desde una URL y lo guarda en el sistema de archivos, porque me daba problemas todo d.
 * @param {string} url - URL del archivo a descargar, claramente, ¿No?
 * @param {string} outputPath - Ruta donde se guarda el archivo, es absoluta porque se me canta del culo, a llorar a la llorería con path.join
 * @returns {Promise<void>} - Promesa que se resuelve al completar la descarga, btw void XJKDHDHDHJKDKHAKDJHSKLDAS.
 */
async function downloadFile({ url, outputPath }) {
  if (typeof url !== 'string' || typeof outputPath !== 'string') {
    throw new TypeError('La URL y la ruta de salida deben ser strings.');
  }

  const directory = path.dirname(outputPath);

  console.log(`[INFO] Creando directorio de salida: ${directory}`);

  try {
    await fs.promises.mkdir(directory, { recursive: true });

    console.log(`[INFO] Solicitando archivo desde: ${url}`);

    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 10000
    });

    if (response.status !== 200) {
      throw new Error(`Código de estado HTTP inesperado: ${response.status}`);
    }

    const fileStream = fs.createWriteStream(outputPath);

    console.log(`[INFO] Comenzando a escribir en: ${outputPath}`);

    return new Promise((resolve, reject) => {
      response.data.pipe(fileStream);

      fileStream.on('finish', () => {
        console.log(`[OK] Archivo guardado exitosamente en: ${outputPath}`);
        resolve();
      });

      fileStream.on('error', (streamError) => {
        console.error(`[ERROR] Fallo al escribir el archivo: ${streamError.message}`);
        fs.unlink(outputPath, () => reject(streamError));
      });

      response.data.on('error', (responseError) => {
        console.error(`[ERROR] Fallo en el stream de respuesta: ${responseError.message}`);
        fileStream.destroy();
        fs.unlink(outputPath, () => reject(responseError));
      });
    });

  } catch (error) {
    console.error(`[FATAL] Error al descargar el archivo desde ${url}: ${error.message}`);
    throw error;
  }
}

module.exports = { downloadFile };
