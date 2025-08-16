module.exports = {
    name: 'login',
    description: 'Iniciar sesión con nombre de usuario y contraseña',
    execute: async ({ message, dbManager }) => {
        try {

            if (!message.args[0] || !message.args[1]) {
                throw new Error('Error: Uso correcto: `login <username> <password>`.');
            }

            const username = message.args[0];
            const password = message.args[1];

            const user = await dbManager.authenticateUser({ username, password });
            if (!user) {
                throw new Error('Nombre de usuario o contraseña incorrectos.');
            }

            message.reply(`Inicio de sesión exitoso. Bienvenido, ${username}!`);
        } catch (error) {
            message.reply(`Error: ${error.message}`);
            throw error;
        }
    }
};
