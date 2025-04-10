module.exports = {
    name: 'join',
    description: 'aceptar invitaciones a grupos',
    execute: async ({message}) => {
    try {
        if (!message.args[0]) throw new Error('Por favor, proporciona un enlace de invitación')
        await message.acceptInvite(message)
      } catch (error) {
        throw error
      }
  }
};