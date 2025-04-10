module.exports = {
    name: 'changeusername',
    description: 'cambiar nombre de usuario',
    execute: async ({ message, dbManager }) => {
      try {
        const userId = message.sender.match(/^(\d+)@s\.whatsapp\.net$/)[1];
        const user = await dbManager.getUserData(userId);
        if (!user) throw new Error('No se encontró información del usuario.');
        if (!message.args[0]) throw new Error('error, provee un nombre de usuario.')
        if (message.args[0].length >= 15) throw new Error('El nombre no puede exceder los 15 caracteres')
        
          await dbManager.updateUserName({userId, username: message.args[0]});

          message.reply(`El nombre de usuario de ${userId} ha sido actualizado. Nuevo nombre: ${message.args[0]}`);

        } catch (error) {  
          throw error
      }
    }
}
  