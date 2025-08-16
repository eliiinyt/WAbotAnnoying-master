/* eslint-disable no-useless-catch */
module.exports = {
  name: 'daily',
  isOwner: false,
  description: 'Reclama tu recompensa diaria de monedas',
  execute: async ({ message, dbManager }) => {
    try {
      const userId = message.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1] || message.sender.match(/^(\d+)@lid$/)?.[1] || null;
      const user = await dbManager.getUserData(userId);

      if (!user) throw new Error('No se encontró información del usuario.');


      const now = new Date();
      const lastClaimDate = user.dailyRewardDate;

      if (lastClaimDate && (now - lastClaimDate) < 24 * 60 * 60 * 1000) {
        throw new Error('Ya has reclamado tu recompensa diaria. Vuelve mañana.');
      } else {
        const coinsToAdd = 400;
        await dbManager.updateUserCoins({ userId, coinsToAdd });
        await dbManager.updateUserDailyRewardDate({ userId, date: now });

        await message.reply(`¡Has reclamado tu recompensa diaria de ${coinsToAdd} monedas!`);

      }
    } catch (error) {
      throw error;
    }
  },
};
