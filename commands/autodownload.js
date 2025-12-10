const ConfigManager = require('../utils/configManager');
const path = require('path');

module.exports = {
  name: "autodownload",
  alias: ["autodl"],
  description: "Activa o desactiva la descarga automática de enlaces en el grupo",
  execute: async ({ message, env }) => {
    try {
      const configManager = new ConfigManager(path.join(__dirname, '../config.json'));
      const chatId = message.chat;
      
      let enable;
      if (message.args && message.args.length > 0) {
        const arg = message.args[0].toLowerCase();
        if (arg === 'on' || arg === 'enable' || arg === 'true') {
          enable = true;
        } else if (arg === 'off' || arg === 'disable' || arg === 'false') {
          enable = false;
        } else {
           return message.reply('Uso: !autodownload [on/off]');
        }
      } else {
        const currentConfig = configManager.getGroupConfig(chatId);
        enable = !currentConfig.autodownload;
      }

      configManager.setGroupConfig(chatId, 'autodownload', enable);
      
      await message.reply(`Auto-download ha sido ${enable ? 'activado' : 'desactivado'} para este grupo.`);

    } catch (error) {
      console.error('Error en comando autodownload:', error);
      await message.reply('Hubo un error al cambiar la configuración.');
    }
  }
};
