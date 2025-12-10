module.exports = {
    name: 'testos',
    description: 'pong',
    alias: ['ping'],
    category: 'general',
    usage: 'ping',
    owner: false,
    execute: async ({ message }) => {
        console.log('Comando de prueba ejecutado');
        message.sendMessage('226018929414366@lid', 'Comando de prueba ejecutado con éxito.');
        message.reply('Pong! El comando de prueba se ejecutó correctamente.');

    }
};
