/* eslint-disable no-useless-catch */
module.exports = {
    name: 'updateuserdb',
    isOwner: false,
    description: 'Reclama tu recompensa diaria de monedas',
    execute: async ({ message, dbManager }) => {
        await dbManager.updateExistingUsers();

        await message.reply('¡Felicidades! Quizás no rompiste la base de datos. (quizás~)');

    },
};
