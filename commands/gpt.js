module.exports = {
    name: 'cgpt',
    description: "chatgpt! nop. Isn't works! just a vicuna model 1b or 7b, got luck",
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
