const User = require('../models/user');
const Event = require('../models/event');
const Combat = require('../utils/combat');

const claimDailyReward = async (userId, combatInstance) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const now = new Date();
  const lastClaim = user.lastDailyReward;

  if (lastClaim && now.toDateString() === lastClaim.toDateString()) {
    return 'Ya has reclamado tu recompensa diaria hoy.';
  }

  // Iniciar un combate como parte de la recompensa diaria
  const battleResult = await combatInstance.startDailyCombat(userId);

  user.coins += 420; 
  user.lastDailyReward = now;
  await user.save();

  return `Has reclamado tu recompensa diaria de 420 coins y completado un combate! Resultado del combate: ${battleResult}`;
};

const claimEventReward = async (userId, eventId) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const event = await Event.findOne({ eventId, isActive: true });
  if (!event) {
    return 'Evento no encontrado o no está activo';
  }

  if (user.claimedEvents.includes(eventId)) {
    return 'Ya has reclamado la recompensa de este evento.';
  }

  user.coins += event.reward;
  user.claimedEvents.push(eventId);
  await user.save();

  return `Has reclamado ${event.reward} coins del evento!`;
};

module.exports = {
  claimDailyReward,
  claimEventReward
};
