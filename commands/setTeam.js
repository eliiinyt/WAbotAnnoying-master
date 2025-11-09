const TeamManager = require('../utils/teamManager');
const characterData = require('../utils/getCharacterData');
module.exports = {
  name: 'setteam',
  description: 'Selecciona un equipo de 4 personajes para el combate',
  execute: async ({message, dbManager}) => {
    try {
    const userId = message.sender.match(/^(\d+)@s\.whatsapp\.net$/)[1];
    const teamManager = new TeamManager({dbManager});
    const args = message.args
    if (!args[0]) {
      throw new Error('Por favor, proporciona al menos un ID de personajes.');
    }
    if (args[0] === "info") {
        const characterAttributes = new characterData({dbManager});
        const inventory = await teamManager.getTeam({userId})
        // const characters = await getCharacterData(inventory);
        const characterDetails = await Promise.all(inventory.map(async (id) => {
          const char = await characterAttributes.getUserCharacterAttributes(userId, id);
          return {
            ...char,
            id
          };
        }));
        const characterList = characterDetails.map(char => `${char.name} (ID: ${char.id})\nNivel: ${char.level}\nhp: ${char.hp.toFixed(0)}\ndef: ${char.def.toFixed(0)}\natk: ${char.atk.toFixed(0)}\ndaño critico: ${char.crit_dmg.toFixed(1)}%\nprobabilidad critica: ${char.crit_rate.toFixed(1)}%\n`).join('\n');
        return message.reply('> Este es tu equipo actual:\n\n' + characterList);
    }
    if (args.length == 0) {
      message.reply('Por favor, proporciona al menos un ID de personajes.');
      return;
    }

    
      await teamManager.setTeam(userId, args);
      message.reply('Equipo actualizado correctamente.');
    } catch (error) {
      throw error
    }
  }
};
