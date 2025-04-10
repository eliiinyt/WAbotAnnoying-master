module.exports = {
    name: 'ping',
    description: 'pong',
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
  