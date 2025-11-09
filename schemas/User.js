const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  custom_atk: { type: Number, default: 0 },
  custom_hp: { type: Number, default: 0 },
  custom_def: { type: Number, default: 0 },
  custom_crit_dmg: { type: Number, default: 0 },
  custom_crit_rate: { type: Number, default: 0 },
});

const pullDataSchema = new mongoose.Schema({
  pullsSinceLast4Star: { type: Number, default: 0 },
  pullsSinceLast5Star: { type: Number, default: 0 },
});

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  messagesCount: { type: Number, default: 0 },
  commandsCount: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  coins: { type: Number, default: 0 },
  characters: [{ type: String }],
  pullData: pullDataSchema,
  characterData: { type: Map, of: characterSchema },
  team: [{ type: String }],
  lastDailyReward: { type: Date, default: null },
  claimedEvents: [{ type: String }],
});

const User = mongoose.model('User', userSchema);
module.exports = User;
