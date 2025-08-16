
module.exports = {
    name: 'updatelid',
    description: 'Actualizar el LID del usuario',
    execute: async ({ message, dbManager }) => {
        try {
            const userId = message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1] || null;
            if (!userId) throw new Error('No se pudo extraer el ID del usuario.');

            if (!message.args[0] || !message.args[1] || !message.args[2]) {
                throw new Error('Error: Uso correcto: `updatelid <lid> <username> <password>`.');
            }

            const lid = message.args[0];
            const username = message.args[1];
            const password = message.args[2];

            const user = await dbManager.authenticateUser({ username, password });
            if (!user) {
                throw new Error('Nombre de usuario o contraseña incorrectos.');
            }


            await dbManager.updateUserLid({ userId, lid });

            message.reply(`El LID de ${username} ha sido actualizado correctamente.`);
        } catch (error) {
            message.reply(`Error: ${error.message}`);
            throw error;
        }
    }
};
