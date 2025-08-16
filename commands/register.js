const bcrypt = require('bcrypt');

module.exports = {
    name: 'register',
    description: 'Registrar un nuevo usuario con nombre de usuario y contraseña',
    execute: async ({ message, dbManager }) => {
        try {
            const userId = message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1] || message.sender.match(/^(\d+)@lid$/)?.[1] || null;
            if (!userId) throw new Error('No se pudo extraer el ID del usuario.');

            if (!message.args[0] || !message.args[1]) {
                throw new Error('Error: Uso correcto: `register <username> <password>`.');
            }

            const username = message.args[0];
            const password = message.args[1];

            await dbManager.registerUser({ userId, username, password });

            message.reply(`Usuario registrado con éxito. Nombre de usuario: ${username}`);
        } catch (error) {
            message.reply(`Error: ${error.message}`);
            throw error;
        }
    }
};
