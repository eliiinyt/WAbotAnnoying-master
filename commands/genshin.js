const axios = require('axios');
const path = require('path');
const { EnkaClient } = require("enka-network-api")

module.exports = {
    name: 'genshintext',
    description: 'devuelve los datos del usuario en texto',
    execute: async ({message, dbManager}) => {
        try {
            const cachePath = path.resolve(__dirname, '../cache/genshin')
            console.log(cachePath)
            const enka = new EnkaClient({cacheDirectory: cachePath, showFetchCacheLog: true});
            const userId = message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1];
            const player_id = message.args[0];
            if (!player_id) {
                throw new Error('No se ha proporcionado un ID de jugador.');
            }
            const player = await enka.fetchUser(player_id);
            const info = `> Información\nnickname: ${player._data.playerInfo.nickname}\nUID: ${player_id}\nLevel: ${player._data.playerInfo.level}\nLogros: ${player._data.playerInfo.finishAchievementNum}\nWorld Level: ${player._data.playerInfo.worldLevel}\nFirma: ${player._data.playerInfo.signature}\n> Abismo\nNivel: ${player._data.playerInfo.towerFloorIndex}-${player._data.playerInfo.towerLevelIndex}\n`;
            message.reply(info);
        } catch (error) {
            throw error;
        }
    }
}