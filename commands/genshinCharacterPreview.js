const {
    generateCharacterCard,
    generateCharacterShowcase,
    refreshAllData,
    generateUserProfileCard
} = require('../utils/genshin_cards');

const usageMessage = 'Comando no reconocido o faltan argumentos.\nUso: .genshin <profile|card|characters> <ID> [índice]';

module.exports = {
    name: 'genshin',
    description: 'Generador de tarjetas de personajes de Genshin Impact',
    execute: async ({ message }) => {
        try {
            const [command, id, index] = message.args;

            if (!command) {
                return message.reply(usageMessage);
            }

            switch (command.toLowerCase()) {
                case 'profile': {
                    if (!id) {
                        return message.reply('No se proporcionó un ID. \nUso: .genshin profile <ID>');
                    }
                    const profileCard = await generateUserProfileCard(id);
                    return message.reply({
                        image: profileCard,
                        caption: `Perfil de ${id}`,
                        mimetype: 'image/jpeg',
                    });
                }

                case 'characters': {
                    if (!id) {
                        return message.reply('No se proporcionó un ID. \nUso: .genshin characters <ID>');
                    }
                    const showcaseCard = await generateCharacterShowcase(id);
                    return message.reply({
                        image: showcaseCard,
                        caption: `Personajes de ${id}`,
                        mimetype: 'image/jpeg',
                    });
                }

                case 'card': {
                    if (!id) {
                        return message.reply('No se proporcionó un ID. \nUso: .genshin card <ID> <índice>');
                    }
                    if (!index) {
                        return message.reply('No se proporcionó un índice. \nUso: .genshin card <ID> <índice>');
                    }
                    const card = await generateCharacterCard(id, index - 1); 
                    return message.reply({
                        image: card,
                        caption: `Personaje ${index} de ${id}`,
                        mimetype: 'image/jpeg',
                    });
                }

                case 'refreshcache': {
                    await refreshAllData();
                    return message.reply('Caché de Genshin Impact actualizada.');
                }

                default: {
                    return message.reply(usageMessage);
                }
            }
        } catch (error) {
            console.error('Error en el comando .genshin:', error.message);
            return message.reply(`Hubo un error al procesar tu solicitud: ${error.message}`);
        }
    },
};