/* eslint-disable no-useless-catch */

module.exports = {
    name: 'profiletext',
    description: 'devuelve los datos del usuario en texto',
    execute: async ({ message, dbManager }) => {
        try {
            const userId = message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1] || message.sender.match(/^(\d+)@lid$/)?.[1] || message.args[0] || null;
            if (!userId) {
                throw new Error(`No se encontró información del usuario.: ${userId}`);
            }
            const user = await dbManager.getUserData(userId);
            console.log(user);
            if (!user) {
                throw new Error(`datos no encontrados para el usuario: ${userId}`);
            }
            let userData = '> User Data';
            if (user.user_name) {
                userData += `\n> Username: ${user.user_name}`;
            }
            userData += `\n> ID: ${user.user_id}\n> Messages Count: ${user.messages_count}\n> Commands Count: ${user.commands_count}\n> XP: ${user.xp}\n> Level: ${user.level}`;
            message.reply(userData);
        } catch (error) {
            throw error;
        }
    }
};