
module.exports = {
    name: 'profiletext',
    description: 'Retrieve user data',
    execute: async ({message, dbManager}) => {
        try {
            const userId = message.sender.match(/^(\d+)@s\.whatsapp\.net$/)[1];
            const user = await dbManager.getUserData({userId});

            if (!user) {
                message.reply(`datos no encontrados para el usuario: ${userId}`);
                return;
            }

            const userData = `> User Data\n> ID: ${user.user_id}\n> Messages Count: ${user.messages_count}\n> Commands Count: ${user.commands_count}\n> XP: ${user.xp}\n> Level: ${user.level}`;

            message.reply(userData);
        } catch (error) {
            console.error('Error fetching user data:', error);
            message.reply('An error occurred while fetching user data.');
        }
    }
}