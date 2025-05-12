const BattleManager = require('../utils/battleManager');
const Enemy = require('../utils/enemy');
module.exports = {
  name: 'battle',
  isOwner: true,
  description: 'Inicia una batalla contra enemigos',
  execute: async ({ message, dbManager, watchMessage }) => {
    try {
      const userId = message.sender.match(/^(\d+)@s\.whatsapp\.net$/)[1];
      const battleManager = new BattleManager({dbManager});
      const enemies = [new Enemy('Slime', 50, 10, 5), new Enemy('Goblin', 60, 15, 10)];
      await battleManager.startBattle({userId, message, watchMessage, enemies});
    } catch (error) {
      throw error;

    }
  }
};
