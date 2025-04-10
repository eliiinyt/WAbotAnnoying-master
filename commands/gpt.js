module.exports = {
    name: 'cgpt',
    description: 'pong',
    execute: async ({message, gptWrapper}) => {
        try {
        await message.sendPresence('composing')
        const res = await gptWrapper.sendMessage(message.args.join(' '))
        await message.reply(res.choices[0].message.content)
        message.sendPresence('paused')
        } catch (error) {
            throw error
        }
        
    }
  };
