const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs').promises;
module.exports = {
    name: 'profile',
    description: 'Devuelve una tarjeta de perfil de usuario con sus datos en la DB',
    execute: async ({ message, dbManager }) => {
        try {

            const userId = (message.mentions.length > 0 ? message.mentions[0].match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1] : message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1]);

            const user = await dbManager.getUserData(userId);

            if (!user) {
                throw new Error(`Datos no encontrados para el usuario: ${userId}`);
            }

    
            const canvas = createCanvas(800, 400);
            const ctx = canvas.getContext('2d');

           
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#FF69B4');
            gradient.addColorStop(1, '#800080');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const filePath = path.join(__dirname, '../', 'assets', "profile")
            const files = await fs.readdir(filePath);
            let bgImage = files[Math.floor(Math.random() * files.length)];
            bgImage = await fs.readFile(path.join(filePath, bgImage));
            bgImage = await loadImage(bgImage)
            ctx.save(); 
            ctx.globalAlpha = 0.3; 
            ctx.drawImage(bgImage, (canvas.width - 100) / 2, (canvas.height - 300) / 2, 300, 300);
            ctx.restore();

            let avatar;
            try {
                avatar = await loadImage(await message.getProfilePicture(userId + '@s.whatsapp.net'));
            } catch (error) {
                console.error('Error fetching profile picture:', error.message, error.data);
                avatar = await loadImage(path.join(__dirname, '../', 'assets', 'gachapon', 'images', 'defaultImg.png')); // Default avatar path
            }

            const avatarSize = 160;
            const avatarX = 20;
            const avatarY = 20;
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();


            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            
        
            let startY = 50;
            if (user.user_name !== undefined) {
                ctx.fillText(`Nombre de usuario: ${user.user_name}`, 200, startY);
                startY += 30;
            }

            ctx.fillText(`ID: ${user.user_id}`, 200, startY);
            ctx.fillText(`Mensajes: ${user.messages_count}`, 200, startY + 30);
            ctx.fillText(`Comandos: ${user.commands_count}`, 200, startY + 60);
            ctx.fillText(`XP: ${user.xp}`, 200, startY + 90);
            ctx.fillText(`Nivel: ${user.level}`, 200, startY + 120);
            ctx.fillText(`Monedas: ${user.coins}`, 200, startY + 150);

            
            const buffer = canvas.toBuffer();
            const imageMessage = {
                caption: 'Perfil del Usuario',
                image: buffer
            };
            message.reply(imageMessage);
        } catch (error) {
            throw error;
        }
    }
};