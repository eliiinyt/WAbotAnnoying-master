module.exports = {
    name: 'testos',
    description: 'pong',
    alias: ['ping'],
    category: 'general',
    usage: 'ping',
    owner: false,
    execute: async ({ message, gptWrapper }) => {
        console.log('Comando de prueba ejecutado');
        await gptWrapper.resetChat();
        message.reply('sans');

    }
};
