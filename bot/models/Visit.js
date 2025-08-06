// models/Visit.js
const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  date: { type: String, required: true }, // в формате YYYY-MM-DD
  startTime: { type: String, required: true }, // в формате HH:mm
  endTime: { type: String, required: true },   // в формате HH:mm
  hadLunch: { type: Boolean, default: false }, // обедал ли ребенок
  hadDinner: { type: Boolean, default: false }, // ужинал ли ребенок
});

module.exports = mongoose.model('Visit', visitSchema);
// models/Visit.js