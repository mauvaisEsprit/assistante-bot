const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const childSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hourlyRate: { type: Number, required: true, default: 0 },
  mealRate: { type: Number, required: true, default: 0 },
  serviceRate: { type: Number, required: true, default: 0 },
  overtimeThreshold: { type: Number, default: 45 },
  overtimeMultiplier: { type: Number, default: 1.25 },
  pinCode: { type: String, unique: true, required: true }, // будет хранить хеш
  createdAt: { type: Date, default: Date.now },
});

// Перед сохранением — если pinCode изменён, хешируем
childSchema.pre('save', async function(next) {
  if (!this.isModified('pinCode')) return next();

  try {
    const saltRounds = 10;
    this.pinCode = await bcrypt.hash(this.pinCode, saltRounds);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Child", childSchema);
