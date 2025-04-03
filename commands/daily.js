module.exports = {
    name: 'daily',
    description: 'Reclama tu recompensa diaria de monedas',
    execute: async ({ message, dbManager }) => {
      try {
        const userId = message.sender.match(/^(\d+)@s\.whatsapp\.net$/)[1];
        const user = await dbManager.getUserData(userId);
  
        if (!user) {
          await message.reply('No se encontró información del usuario.');
          return;
        }
  
        const now = new Date();
        const lastClaimDate = user.dailyRewardDate;
  
        if (lastClaimDate && (now - lastClaimDate) < 24 * 60 * 60 * 1000) {
          await message.reply('Ya has reclamado tu recompensa diaria. Vuelve mañana.');
        } else {
          const coinsToAdd = 400;
          await dbManager.updateUserCoins({userId, coinsToAdd});
          console.log(now)
          await dbManager.updateUserDailyRewardDate({userId, date: now});
  
          await message.reply(`¡Has reclamado tu recompensa diaria de ${coinsToAdd} monedas!`);

        }
      } catch (error) {
        console.error('Error al procesar el comando daily:', error);
        await message.reply('Ocurrió un error al procesar el comando. Inténtalo de nuevo más tarde.');
      }
    },
  };
  