module.exports = {
    name: 'getlid',
    description: 'Obtener el LID del usuario',
    execute: async ({ message }) => {
        try {
            const lid = message.sender.match(/^(\d+)@lid$/)?.[1];
            if (!lid) {
                throw new Error('No se pudo obtener el LID del usuario.');
            }
            message.reply(`Tu LID es: ${lid}`);
        } catch (error) {
            message.reply(`Error: ${error.message}`);
            throw error;
        }
    }
};
