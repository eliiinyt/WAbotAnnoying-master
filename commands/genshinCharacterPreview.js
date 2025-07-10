
const {
    generateCharacterCard,
    generateCharacterShowcase,
} = require('../utils/genshin_cards');
module.exports = {
    name: 'genshin',
    description: 'Generador de tarjetas de personajes de Genshin Impact',
    execute: async ({ message }) => {
        if (!message.args || message.args.length === 0) {
            throw new Error(
                'No se proporcionaron argumentos. Uso: .genshin <profile|card> <ID> [índice]'
            );
        }

        const command = message.args[0];
        const id = message.args[1];
        const index = message.args[2];

        if (!id) {
            throw new Error(
                'No se proporcionó un ID. Uso: .genshin <profile|card> <ID> [índice]'
            );
        }

        if (command === 'profile') {
            const profileCard = await generateCharacterShowcase(id);
            await message.reply({
                image: profileCard,
                caption: `Personajes de ${id}`,
                mimetype: 'image/jpeg',
            });
        } else if (command === 'card') {
            if (!index) {
                throw new Error(
                    'No se proporcionó un índice de personaje. Uso: .genshin card <ID> <índice>'
                );
            }
            const card = await generateCharacterCard(id, index - 1);
            await message.reply({
                image: card,
                caption: `Personaje de ${id}`,
                mimetype: 'image/jpeg',
            });
        } else {
            throw new Error(
                'Comando no reconocido. Uso: .genshin <profile|card> <ID> [índice]'
            );
        }
    },
};
