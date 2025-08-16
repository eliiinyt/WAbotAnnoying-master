/* eslint-disable no-useless-catch */
const { getCharacterData, generateInventoryImage, generateCharacterProfile } = require('../utils/invGenerator');
const characterData = require('../utils/getCharacterData');

module.exports = {
  name: 'gachapon',
  description: 'Gachapon',
  isOwner: false,
  execute: async ({ message, gachapon, dbManager }) => {
    try {
      const characterAttributes = new characterData({ dbManager });
      const userId = message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1] || message.sender.match(/^(\d+)@lid$/)?.[1] || null;
      const args = message.args;
      const command = args[0];
      const pulls = args[1] ? parseInt(args[1], 10) : 1;

      if (command === 'pull') {
        if (isNaN(pulls) || pulls <= 0) {
          throw new Error('Número inválido, por favor especifique un número entero positivo');
        }

        const characterIds = await gachapon.pull(userId, pulls);
        console.log(characterIds);
        const pullResults = characterIds.map((charId, index) => {
          if (charId === null) {
            return `Tiro ${index + 1}: No conseguiste nada`;
          } else {
            const character = gachapon.characters[charId];
            return `Tiro ${index + 1}: Conseguiste el personaje ${character.name}`;
          }
        }).join('\n');

        message.reply(pullResults);

      } else if (command === 'inventory' || command === 'inv') {
        const inventory = await gachapon.inventory(userId);
        if (inventory.length === 0) {
          message.reply('No tienes personajes en tu inventario');
        } else {
          const characters = await getCharacterData(inventory);
          const buffer = await generateInventoryImage(characters);

          const characterDetails = await Promise.all(inventory.map(async (id) => {
            const char = await characterAttributes.getUserCharacterAttributes(userId, id);
            return {
              ...char,
              id
            };
          }));

          const characterList = characterDetails.map(char => `${char.name} (ID: ${char.id}, Nivel: ${char.level})`).join('\n');
          const imageMessage = {
            caption: `> Tus personajes:\n${characterList}`,
            image: buffer
          };
          await message.reply(imageMessage);
        }
      } else if (command === 'profile') {
        const characterId = args[1]; // ID del personaje se pasa como segundo argumento

        if (!characterId) {
          throw new Error('Por favor, proporciona el ID del personaje para ver su perfil.');
        }
        //const characters = await getCharacterData(inventory);
        const characterDetails = await characterAttributes.getUserCharacterAttributes(userId, characterId);
        console.log(characterDetails);
        const buffer = await generateCharacterProfile({ characterId, characterDetails });
        const imageMessage = {
          caption: `> Detalles del personaje con ID ${characterId}:`,
          image: buffer
        };
        await message.reply(imageMessage);

      } else if (command === 'levelup') {
        const characterId = args[1]; // el ID del personaje se pasa como segundo argumento
        const newLevel = parseInt(args[2], 10); // nuevo nivel se pasa como tercer argumento

        if (isNaN(newLevel) || newLevel <= 0) {
          throw new Error('Nivel inválido, por favor especifique un número entero positivo');
        }
        const updatedCharacter = await characterAttributes.levelUp({ userId, characterId, newLevel });

        const responseMessage = `¡El personaje ${updatedCharacter.name} ha sido actualizado a nivel ${updatedCharacter.level}!`;
        message.reply(responseMessage);

      } else {
        message.reply('Comando inválido, usa "gachapon pull", "gachapon inventory", "gachapon profile [ID]" o "gachapon levelup [ID] [Nuevo Nivel]".');
      }
    } catch (error) {
      throw error;
    }
  },
};
