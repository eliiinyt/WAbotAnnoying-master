module.exports = {
    name: 'cgpt',
    description: 'pong',
    execute: async ({message, gptWrapper}) => {
        const query = message.args.join(' ')
        await message.sendPresence('composing')
        const res = await gptWrapper.sendMessage(query)
        await message.reply(res.choices[0].message.content)
        message.sendPresence('paused')
    }
  };
  