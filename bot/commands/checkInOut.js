// commands/checkInOut.js
const { handleCheckIn, handleCheckOut, handleLunchAnswer } = require('../handlers/checkInOutHandler');
const sessionAuthMiddleware = require('../middleware/sessionAuthMiddleware');

module.exports = (bot) => {
  bot.action(/^checkin_(.+)$/, sessionAuthMiddleware, async (ctx) => {
    await handleCheckIn(ctx);
  });

  bot.action(/^checkout_(.+)$/, sessionAuthMiddleware, async (ctx) => {
    await handleCheckOut(ctx);
  });

  bot.action(/^(lunchyes|lunchno)$/, sessionAuthMiddleware, async (ctx) => {
    await handleLunchAnswer(ctx);
  });
};
