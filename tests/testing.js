const CobaltAPI = require("./cobalt.js");

(async () => {
  const api = new CobaltAPI(
    "http://localhost:9000",
    "db50d9a7-d4e3-4e6f-9799-f17215ddff0b"
  );

  try {
    const downloadData = {
      url: "https://www.youtube.com/shorts/lvCuI2W28Jo",
      videoQuality: "720",
      audioFormat: "mp3",
      filenameStyle: "pretty",
    };

    const downloadResponse = await api.processDownload(downloadData);
    console.log("Download Response:", downloadResponse);

    const serverInfo = await api.getServerInfo();
    console.log("Server Info:", serverInfo);
  } catch (error) {
    throw error;
  }
})();
