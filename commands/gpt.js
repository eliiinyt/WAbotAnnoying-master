module.exports = {
    name: 'cgpt',
    description: 'Chat con Gemini (waifu tsundere).',
    execute: async ({ message, gptWrapper }) => {
        try {
            await message.sendPresence('composing');

            const mainText = message.args.join(' ').trim();

            let quotedText = '';
            if (message.quoted?.body && message.quoted.sender !== message.sender) {
                quotedText = message.quoted.body.trim();
            }
            let prompt = '';
            if (quotedText && mainText) {
                prompt = `Mensaje citado:\n「${quotedText}」\n\nMensaje actual:\n「${mainText}」\n\nResponde considerando la cita.`;
            } else if (quotedText) {
                prompt = `El usuario quiere que comentes este mensaje:\n「${quotedText}」`;
            } else {
                prompt = mainText;
            }

            const isImageMain = message.mimetype && /image/g.test(message.mimetype);
            const isImageQuoted = message.quoted?.mimetype && /image/g.test(message.quoted?.mimetype);
            const hasImage = isImageMain || isImageQuoted;

            let reply;

            if (hasImage) {
                const imgMsg = isImageMain ? message : message.quoted;
                const { buffer, fileInfo } = await imgMsg.download();

                const mime = fileInfo?.mime || imgMsg.mimetype || 'image/jpeg';

                reply = await gptWrapper.sendMessage(prompt || 'Describe esta imagen', {
                    imageBuffer: buffer,
                    mimeType: mime
                });
            } else {

                reply = await gptWrapper.sendMessage(prompt);
            }

            await message.reply(reply || '⚠️ No pude generar una respuesta.');
        } catch (err) {
            console.error('[❌ cgpt] Error en Gemini:', err);
            await message.reply('⚠️ Error interno, intenta otra vez.');
        } finally {
            await message.sendPresence('paused').catch(() => { });
        }
    },
};
