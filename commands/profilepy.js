// const { exec } = require('child_process');
// const {writeFile, unlink} = require('fs/promises');
// const path = require('path');

// module.exports = {
//     name: 'profilepy',
//     description: 'devuelve los datos del usuario en una imagen hecha con python',
//     execute: async ({ message, dbManager }) => {
//         try {
//             const userId = message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1];
//             const user = await dbManager.getUserData({userId});

//             if (!user) {
//                 message.reply(`Datos no encontrados para el usuario: ${userId}`);
//                 return;
//             }
//             let pp = await message.getProfilePicture(message.sender)
//             let buffer = await fetch(pp)
//             buffer = await buffer.arrayBuffer()
//             buffer = Buffer.from(buffer);
//             profilePicture = path.join(__dirname, '../cache', 'temp', `${Date.now()}.jpg`)
//             await writeFile(profilePicture, buffer)

//             //el día que rompí mis limites
//             exec(`python commands/py_commands/profile.py ${user.user_id} ${profilePicture} ${user.messages_count} ${user.commands_count} ${user.xp} ${user.level}`, { windowsHide: true }, (error, stdout, stderr) => {
//                 if (error) {
//                     console.error(`Error: ${error.message}`);
//                     message.reply('An error occurred while creating the profile image.');
//                     return;
//                 }
//                 if (stderr) {
//                     console.error(`stderr: ${stderr}`);
//                     message.reply('An error occurred while creating the profile image.');
//                     return;
//                 }

//                 // Leer la salida (stdout) que debería ser el nombre del archivo de imagen (debería) // al final si lo era, funny
//                 const imageName = stdout.trim();
//                 console.log(imageName)
//                 message.reply({ image: { url: imageName }, caption: "test", mimetype: "image/jpeg" });
                
//             });
//         } catch (error) {
//             console.error('Error fetching user data:', error);
//             message.reply('An error occurred while fetching user data.');
//         }
//     }
// };
