import { Llama } from 'node-llama-cpp';

class GPTWrapper {
  constructor(modelPath, options = {}) {
    this.modelPath = modelPath;
    this.options = options;
    this.llama = null;
    this.context = null;
    this.chatSession = null;
  }

  async load() {
    try {
      this.llama = new Llama({
        modelPath: this.modelPath,
        gpuLayers: this.options.gpuLayers ?? 0,
      });

      this.context = await this.llama.createContext({
        nCtx: this.options.nCtx ?? 2048,
        threads: this.options.threads ?? 4,
      });

      this.chatSession = this.context.createChatSession({
        systemPrompt:
          this.options.systemPrompt ??
          'Eres una asistente llamada "wAI", hablas español y tienes personalidad tsundere.',
      });

      console.log('✅ Modelo cargado correctamente');
    } catch (err) {
      console.error('❌ Error cargando el modelo:', err);
    }
  }

  async sendMessage(message) {
    if (!this.chatSession) {
      console.log('⚠️ La sesión no está inicializada');
      return null;
    }
    try {
      const response = await this.chatSession.prompt(message);
      return response.outputText || response;
    } catch (err) {
      console.error('❌ Error enviando mensaje:', err);
      return null;
    }
  }
}

// Ejemplo
async function main() {
  const wrapper = new GPTWrapper('./phi-2.Q4_0.gguf');
  await wrapper.load();
  const res = await wrapper.sendMessage('Hola, ¿cómo estás?');
  console.log('Respuesta:', res);
}

main();
