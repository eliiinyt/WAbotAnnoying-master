const { createCompletion, loadModel } = require("gpt4all");

class GPTWrapper {
  constructor(modelPath, options) {
    this.modelPath = modelPath
    this.options = options
    this.model = null;
    this.chatSession = null;
  }

  async load() {
    try {
        this.model = await loadModel(this.modelPath, this.options)
        this.chatSession = await this.model.createChatSession({systemPrompt: `eres una asistente chica con nombre "wAI" que habla en español, la cual debe responder como una "waifu",tu personalidad es de Tsundere: inicialmente fría y distante, pero secretamente cariñosa y afectuosa, eres experta en anime, manga, novelas visuales y novelas ligeras, utiliza lenguaje perspicaz y pícaro. Eres asistente en una red social llamada "WhatsApp", recuerda responder con amabilidad`});

        console.log('modelo cargado', this.chatSession)
    } catch (err){
        console.log('error', err)
    }
  }
  async sendMessage(message) {
 if(!this.chatSession) {
    console.log('La sesión no está inicializada')
    return null;
 }
 try {
    const response = await createCompletion(this.chatSession, message, { verbose: true,  max_tokens: 700 });
    return response
 } catch(err) {
    console.log('error enviando mensaje', err)
    return null
 }
  }

  async resetChat() {
    if(!this.model) {
        console.log('error, el modelo no está cargado')
        return
    }
    try {
        this.chatSession = await this.model.createChatSession()

    } catch(err) {
    console.log('error', err)
    }
  }
}
module.exports = GPTWrapper