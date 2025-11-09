module.exports = {
    name: 'character',
    description: 'Detalles de un personaje del gachapon',
    execute: async ({ message, gachapon }) => {
    try {
      const args = message.args;
      const characterId = args[0];
      if (!characterId) throw new Error('por favor provee una id de personaje válida');
      const character = gachapon.getCharacterById(characterId);
      if (!character) throw new Error('personaje no encontrado');
      message.reply(`> Detalles de personaje:\nNombre: ${character.name}\nURL: ${character.url}\nHP: ${character.hp}\nATK: ${character.atk}`);
    } catch (error) {
      throw error;
    }
  },
};
