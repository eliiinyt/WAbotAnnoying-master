const path = require('path');
const { EnkaClient } = require('enka-network-api');

module.exports = {
    name: 'genshintext',
    description: 'devuelve los datos del usuario en texto',
    execute: async ({ message }) => {
        try {
            const cachePath = path.resolve(__dirname, '../cache/genshin');
            console.log(cachePath);
            const enka = new EnkaClient({ cacheDirectory: cachePath, showFetchCacheLog: true });
            // const userId = message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1];
            const player_id = message.args[0];
            if (!player_id) {
                throw new Error('No se ha proporcionado un ID de jugador.');
            }
            const player = await enka.fetchUser(player_id);
            const info = `> Información
        nickname: ${player._data.playerInfo.nickname}
        UID: ${player_id}
        Level: ${player._data.playerInfo.level}
        Logros: ${player._data.playerInfo.finishAchievementNum}
        World Level: ${player._data.playerInfo.worldLevel}
        Firma: ${player._data.playerInfo.signature}
        > Abismo
        Nivel: ${player._data.playerInfo.towerFloorIndex}-${player._data.playerInfo.towerLevelIndex}
        `;
            message.reply(info);
        } catch (error) {
            console.error(error);
            message.reply('Ha ocurrido un error al procesar la solicitud.');
        };
    }
};