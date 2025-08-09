const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  role: { type: String, enum: ["admin", "parent"], default: null },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Child",
    default: null,
  },
  addChildStep: { type: String, default: null },
  tempChildName: { type: String, default: null },
  editPriceStep: { type: String, default: null },
  editPriceField: { type: String, default: null },
  editPriceChildId: { type: mongoose.Schema.Types.ObjectId, ref: "Child", default: null },
  expiresAt: { type: Date, default: null },
});

module.exports = mongoose.model("Session", sessionSchema);
