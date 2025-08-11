const childSelectHandler = require('../handlers/childSelectHandler');
const sessionAuthMiddleware = require('../middleware/sessionAuthMiddleware');

module.exports = (bot) => {
  bot.action(/^child_/,sessionAuthMiddleware, async (ctx) => {
    await ctx.answerCbQuery();
    await childSelectHandler(ctx);
  });
};
