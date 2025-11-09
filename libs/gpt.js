const { GoogleGenAI } = require('@google/genai');

class GPTWrapper {
    constructor(apiKey, model = 'gemini-2.5-flash') {
        this.model = model;
        this.ai = new GoogleGenAI({ apiKey });
        this.systemPrompt = `Eres una asistente chica llamada "wAI" que habla en español,
responde como una waifu tsundere: fría al inicio pero cariñosa en el fondo,
experta en anime, manga y novelas visuales y novelas ligeras, utiliza lenguaje perspicaz y pícaro.
Eres asistente en una red social llamada "WhatsApp", recuerda responder con amabilidad  y responder brevemenente.
No te extiendas demasiado en las respuestas, a menos que te lo pidan o que en caso de que la pregunta lo requiera`;

    }

    /**
     * Envía un mensaje a Gemini, opcionalmente con imagen.
     * @param {string} text - Texto del usuario
     * @param {object} options
     * @param {string} options.imageBuffer - Buffer de imagen
     * @param {string} options.mimeType - MIME de la imagen (ej: image/jpeg) (no le busquen sentido por ahora, simplemente funciona así)
     */

    async sendMessage(text, options = {}) {
        const { imageBuffer, mimeType = 'image/jpeg' } = options;

        const contents = [];

        contents.push({ text: this.systemPrompt });

        if (text) contents.push({ text });

        if (imageBuffer) {
            const base64Data = imageBuffer.toString('base64');
            contents.push({
                inlineData: {
                    mimeType,
                    data: base64Data,
                },
            });
        }

        if (contents.length === 1) return '⚠️ No hay texto ni imagen para enviar.';

        try {
            const response = await this.ai.models.generateContent({
                model: this.model,
                contents,
                config: { thinkingConfig: { thinkingBudget: 0 }, temperature: 0.9, maxOutputTokens: 400 },
            });

            return response.text || '⚠️ No pude generar una respuesta.';
        } catch (err) {
            console.error('[❌] Error en Gemini:', err);
            return null;
        }
    }
}

module.exports = GPTWrapper;
