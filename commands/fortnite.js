const {
    generateFortniteCard
} = require('../utils/fortnite_cards'); 
const FORTNITE_API_KEY = process.env.FORTNITE_API_KEY;
function extractUsername(args) {
    const userArgs = args.slice(0);
    let username = userArgs.join(' ');
    if (username.startsWith('"') && username.endsWith('"')) {
        username = username.slice(1, -1);
    }
    return username.trim();
}
module.exports = {
    name: 'fortnite',
    description: 'Generador de tarjetas de estadísticas de Fortnite Battle Royale (Lifetime).',
    execute: async ({ message }) => {
        try {
            const username = extractUsername(message.args);
            const usageMessage = 'Comando incorrecto o faltan argumentos.\nUso: .fortnite <nombre_de_usuario>';
            if (!username) {
                return message.reply(usageMessage);
            }

            if (!FORTNITE_API_KEY) {
                return message.reply('❌ **Error de configuración:** La clave API de Fortnite no está configurada.');
            }

            if (!username) {
                return message.reply('No se proporcionó un nombre de usuario. \nUso: `.fortnite <nombre_de_usuario>`');
            }
            await message.reply(`Buscando estadísticas de Fortnite para **${username}**... ⏳`);

            const cardBuffer = await generateFortniteCard(username, FORTNITE_API_KEY);

            return message.reply({
                image: cardBuffer,
                caption: `Estadísticas de por vida de ${username}`,
                mimetype: 'image/jpeg',
            });

        } catch (error) {
            console.error('Error en el comando .fortnite:', error.message);
            return message.reply(`Hubo un error al procesar tu solicitud: ${error.message.split('**')[0]}. Verifica si el nombre de usuario es correcto.`);
        }
    },
};