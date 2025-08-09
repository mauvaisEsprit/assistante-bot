const mongoose = require("mongoose");

const childSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  hourlyRate: {
    type: Number,
    required: true,
    default: 0,
  },
  mealRate: {
    type: Number,
    required: true,
    default: 0,
  },
  serviceRate: {
    type: Number,
    required: true,
    default: 0,
  },
  overtimeThreshold: {
    type: Number,
    default: 45, // часы в неделю до переработки
  },
  overtimeMultiplier: {
    type: Number,
    default: 1.25, // множитель сверхурочных
  },
  pinCode: { type: String, unique: true, required: true },
  //telegramUsers: [{ type: Number }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Child", childSchema);
