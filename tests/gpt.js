const { LLModel, createCompletion, DEFAULT_DIRECTORY, DEFAULT_LIBRARIES_DIRECTORY, loadModel } = require("gpt4all")

const fun = async() => {
const model = await loadModel('WaifuAI-L3-8B-8k-gguf-unsloth.F16.gguf', {allowDownload: true, verbose: true, device: 'amd', nCtx: 128, ngl:  4});
const chat = await model.createChatSession();
console.log(chat)
const completion1 = await createCompletion(model, 'Hola, ¿Hablas español?', { verbose: false, })
console.log(completion1.choices[0].message.content)

const completion2 = await createCompletion(model, '¿Qué dije en el mensaje anterior?', {  verbose: false  })
console.log(completion2.choices[0].message.content)

model.dispose()
}
fun()