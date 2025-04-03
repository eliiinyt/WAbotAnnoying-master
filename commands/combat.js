const BattleManager = require('../utils/battleManager');
const Enemy = require('../utils/enemy');
module.exports = {
  name: 'battle',
  description: 'Inicia una batalla contra enemigos',
  execute: async ({ message, dbManager, watchMessage }) => {
    try {
      const userId = message.sender.match(/^(\d+)@s\.whatsapp\.net$/)[1];
      const battleManager = new BattleManager({dbManager});
      const enemies = [new Enemy('Slime', 50, 10, 5), new Enemy('Goblin', 60, 15, 10)];

      await battleManager.startBattle({userId, message, watchMessage, enemies});
    } catch (error) {
      console.error('Error al procesar el comando battle:', error);
      await message.reply('Ocurrió un error al procesar el comando. Inténtalo de nuevo más tarde.');
    }
  }
};
