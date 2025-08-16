
module.exports = {
    name: 'ship',
    description: 'elige dos personas al azar en el grupo y las empareja',
    execute: async ({ message }) => {
        try {
            const groupMetadata = await message.groupMetadata();
            const participants = groupMetadata.participants;


            if (participants.length < 2) {
                return message.reply('¡Necesitas al menos 2 participantes en el grupo para hacer un ship!');
            }
            const participant1 = participants[Math.floor(Math.random() * participants.length)];
            const participant2 = participants[Math.floor(Math.random() * participants.length)];
            while (participant1.id === participant2.id) {
                participant2.id = participants[Math.floor(Math.random() * participants.length)].id;
            }
            const extractId = (id) => {
                return id.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1] || id.match(/^(\d+)@lid$/)?.[1] || id;
            };
            const user1 = extractId(participant1.id);
            const user2 = extractId(participant2.id);
            const comments = [
                '¡Harían una pareja increíble!',
                '¡Una pareja inesperada pero perfecta!',
                '¡Una pareja que duraría para siempre!',
                '¡Una pareja que terminaría en desastre!',
                '¿En serio? ¡No lo veo!',
                '¡Una pareja que nadie esperaba!',
            ];
            const comment = comments[Math.floor(Math.random() * comments.length)];
            await message.reply(
                `@${user1} haría ${comment} con @${user2}`,
                { mentions: [participant1.id, participant2.id] }
            );
        } catch (error) {
            message.reply(`Error: ${error.message}`);
            throw error;
        }

    },
};
