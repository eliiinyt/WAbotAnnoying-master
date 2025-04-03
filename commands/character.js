module.exports = {
    name: 'character',
    description: 'lal',
    execute: async ({ message, gachapon }) => {
    try {
      const args = message.args;
      const characterId = args[0];
      
      if (!characterId) {
        message.reply('por favor provee una id de personaje válida');
        return;
      }

      const character = gachapon.getCharacterById(characterId);
      
      if (!character) {
        message.reply('personaje no encontrado');
        return;
      }

      message.reply(`> Detalles de personaje:\nNombre: ${character.name}\nURL: ${character.url}\nHP: ${character.hp}\nATK: ${character.atk}`);
    } catch (error) {
      message.reply(`Error: ${error.message}`);
    }
  },
};
