const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  reward: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
