module.exports = {
    name: 'changeusername',
    description: 'cambiar nombre de usuario',
    execute: async ({ message, dbManager }) => {
      try {
        const userId = message.sender.match(/^(\d+)@s\.whatsapp\.net$/)[1];
        const user = await dbManager.getUserData(userId);
  
        if (!user) {
          await message.reply('No se encontró información del usuario.');
          return;
        }
        if (!message.args[0]) {
            return message.reply('error, provee un nombre de usuario.')
        }
        if (message.args[0].length >= 15) {
            return message.reply('error, el nombre no puede exceder los 15 caracteres')
        }
          await dbManager.updateUserName({userId, username: message.args[0]});
  
          await message.reply(`El nombre de usuario de ${userId} ha sido actualizado. Nuevo nombre: ${message.args[0]}`);

        } catch (error) {
        console.error('Error al cambiar el nombre:', error);
        await message.reply('Ocurrió un error al procesar el comando. Inténtalo de nuevo más tarde.');
      }
    }
}
  