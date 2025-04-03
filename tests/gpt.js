
process.env.HF_HOME = '../models'
const { createCompletion, loadModel } = require("gpt4all")

const fun = async() => {
const model = await loadModel('DeepSeek-R1-Distill-Qwen-1.5B-Q8_0.gguf', { modelPath: "../models/", allowDownload: true, verbose: true, device: 'gpu', nCtx: 204, ngl:  4, modelConfigFile: "../models/models3.json"} );
const chat = await model.createChatSession();
console.log(chat)
const completion1 = await createCompletion(model, 'Hola, ¿Hablas español?', { verbose: false, })
console.log(completion1.choices[0].message.content)

const completion2 = await createCompletion(model, '¿Qué dije en el mensaje anterior?', {  verbose: false  })
console.log(completion2.choices[0].message.content)

model.dispose()
}
fun()