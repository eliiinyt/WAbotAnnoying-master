module.exports = {
    name: 'testos',
    description: 'pong',
    alias: ['ping'],
    category: 'general',
    usage: 'ping',
    owner: false,
    execute: async ({ message }) => {
        console.log('Comando de prueba ejecutado');
        message.sendMessage('120363418445417809@g.us', 'pong');

    }
};
