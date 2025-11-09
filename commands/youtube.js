
const CobaltAPI = require('../tests/cobalt');
const { downloadFile } = require('../utils/functions');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  name: 'youtube',
  alias: ['youtube', 'cobalt', 'yt'],
  description: 'youtube downloader',
  execute: async ({ message, env }) => {
    const api = new CobaltAPI(
      env.API_URL,
      env.COBALT_API_KEY
    );
    if (!message.args || message.args.length === 0) {
      throw new Error('No se proporcionó un enlace de youtube.');
    }

    let isAudio = false;
    if (message.args[0] === 'audio') {
      isAudio = true;

    } else if (message.args[0] === 'video') {
      isAudio = false;
    }
    const downloadData = {
      url: message.args[1],
      audioFormat: 'mp3',
      audioBitrate: '256',
      downloadMode: isAudio ? 'audio' : 'auto',
      youtubeDubLang: isAudio ? undefined : 'es-ES',
      videoQuality: isAudio ? undefined : message.args[2] ? message.args[2].match(/^\d+/)[0] : '480',
      filenameStyle: 'classic',
      youtubeVideoCodec: isAudio ? undefined : 'h264',
      disableMetadata: false,
      //youtubeHLS: false,
      alwaysProxy: false,
    };
    console.log(downloadData);

    const downloadResponse = await api.processDownload(downloadData);


    const serverInfo = await api.getServerInfo();
    console.log('server Info: ', serverInfo, 'download Response: ', downloadResponse);
    if (downloadResponse.status === 'redirect' || downloadResponse.status === 'tunnel') {
      const pathFile = path.join(__dirname, '../', 'cache', 'youtube', downloadResponse.filename);
      const outputPath = path.join(__dirname, '../', 'cache', 'youtube', `processed_${downloadResponse.filename}`);
      message.react('🪫');

      await downloadFile({ url: downloadResponse.url, outputPath: pathFile });
      await new Promise((resolve, reject) => {
        ffmpeg(pathFile)
          .videoCodec('copy')
          .outputOption('-metadata:s:v', 'handler_name="VideoHandler"')
          .outputOption('-preset', 'fast')
          .on('end', resolve)
          .on('error', reject)
          .save(outputPath);
      });
      message.react('🔋');

      message.reply({
        caption: downloadResponse.filename,
        [isAudio ? 'audio' : 'video']: { url: outputPath },
        mimetype: isAudio ? 'audio/mpeg' : 'video/mp4'
      });

    } else if (downloadResponse.status === 'error') {
      throw new Error(downloadResponse.message);
    } else {
      throw new Error('Estado inesperado', downloadResponse.status);
    }
  }
};