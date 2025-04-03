module.exports = {
    name: 'join',
    description: 'aceptar invitaciones a grupos',
    execute: async ({message}) => {
        console.log(message.body)
      await message.acceptInvite(message)
    }
  };