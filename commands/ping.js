module.exports = {
    name: 'ping',
    description: 'pong',
    alias: ['ping'],
    category: 'general',
    usage: 'ping',
    owner: false,
    execute: async ({message}) => {
      try {
        const old = Date.now();
        const mess = await message.reply('pong')
        message.edit({ text: `pong, la velocidad de respuesta es de: ${Date.now() - old}ms`, edit: mess.key })
      } catch (error) {
        throw error
      }
      
    }
  };
  