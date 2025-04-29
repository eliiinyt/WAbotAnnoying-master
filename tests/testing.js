const CobaltAPI = require("./cobalt.js");
const path = require("path");
const fs = require("fs");
const axios = require('axios');
(async () => {
  const api = new CobaltAPI(
    "http://localhost:9000",
    "8512704d-8521-464b-a556-019b8f0a5402"
  );

  try {
    const downloadData = {
      url: "https://vm.tiktok.com/ZMBvCuNdb/",
      videoQuality: "720",
      audioFormat: "mp3",
      filenameStyle: "pretty",
    };

    const downloadResponse = await api.processDownload(downloadData);
    console.log("Download Response:", downloadResponse);

    

    const pathFile = path.join(__dirname, "../", "cache", "youtube", downloadResponse.filename);

    await downloadVideo(downloadResponse.url, pathFile)

        const serverInfo = await api.getServerInfo();
        console.log("Server Info:", serverInfo);
  } catch (error) {
    throw error;
  }
})();

async function downloadVideo(url, outputPath) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    const fileStream = fs.createWriteStream(outputPath);
    response.data.pipe(fileStream);

    return new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
  } catch (error) {
    console.error('Error al descargar el video:', error);
  }
}
