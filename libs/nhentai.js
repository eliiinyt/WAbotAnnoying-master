const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { fileURLToPath } = require('url');

const IMAGE_HOST = 'hitomi.la';

function getGalleryId(imageUrl) {
    console.log(imageUrl);
const match = imageUrl.match(/\/galleries\/(\d+)\//);

  return match ? match[1] : null
}

function getImageFilename(url) {
  return path.basename(new URL(url).pathname);
}

function getImageExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function getImageKind(extension) {
  switch (extension) {
    case 'webp':
      return 'webp';
    case 'avif':
      return 'avif';
    case 'jpg':
    case 'jpeg':
      return 'jpeg';
    case 'png':
      return 'png';
    case 'gif':
      return 'gif';
    default:
      return 'unknown';
  }
}

function downloadImage(url, savePath) {
  return new Promise((resolve, reject) => {
    console.log(`Descargando ${url} a ${savePath}`);
    const file = fs.open(savePath, 'w')
      .then(f => {
        https.get(url, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Request Failed. Status Code: ${res.statusCode}`));
            return;
          }
          const chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', async () => {
            const buffer = Buffer.concat(chunks);
            await fs.writeFile(savePath, buffer);
            resolve();
          });
        }).on('error', reject);
      })
      .catch(reject);
  });
}

class Image {
  constructor(url) {
    this.url = url;
    this.id = getGalleryId(url);
    this.filename = getImageFilename(url);
    this.extension = getImageExtension(this.filename);
    this.kind = getImageKind(this.extension);
  }

  get savePath() {

    return path.join(__dirname, 'downloads', this.filename);
  }

  async download() {
    const saveDir = path.dirname(this.savePath);
    await fs.mkdir(saveDir, { recursive: true });
    await downloadImage(this.url, this.savePath);
  }
}

module.exports = { Image, getGalleryId, getImageFilename, getImageExtension, getImageKind }
