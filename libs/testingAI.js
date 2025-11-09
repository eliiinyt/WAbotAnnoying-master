const chatAI = require('./AI.mjs');

async function main() {
    const wrapper = new chatAI('../tests/AI_test/llama.cpp/phi-2.Q4_0.gguf');
    await wrapper.load();

    const response = await wrapper.sendMessage('Hola, ¿cómo estás?');
    console.log('Respuesta:', response);

    await wrapper.resetChat();
}

main();
