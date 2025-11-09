
// const { EnkaClient } = require('enka-network-api');
// const path = require('path');
// const cachePath = path.resolve(__dirname, '../cache/genshin');

// const enka = new EnkaClient({
//     cacheDirectory: cachePath,
//     showFetchCacheLog: true,
// });
// enka.cachedAssetsManager.cacheDirectorySetup();

// enka.cachedAssetsManager.fetchAllContents();

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const url = 'https://homdgcat.wiki/homdgcat-res/Avatar/UI_NameCardPic_Ganyu_P.png';

async function getBuffer(url) {
    const res = await axios({
        method: 'get',
        url,
        responseType: 'arraybuffer',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        },
        maxRedirects: 5,
    });
    console.log(res.status, res.statusText);
    if (res) return res.data;
}

async function cache({ resource, url }) {
    const pathres = path.join(
        __dirname, '.', `${resource}.png`
    );
    const res = await getBuffer(url);
    fs.writeFileSync(pathres, res);
};


cache({
    resource: 'test',
    url: url,
});
console.log(cache);