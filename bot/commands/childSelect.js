const childSelectHandler = require('../handlers/childSelectHandler');
const sessionAuthMiddleware = require('../middleware/sessionAuthMiddleware');

module.exports = (bot) => {
  bot.action(/^child_/,sessionAuthMiddleware, (ctx) => childSelectHandler(ctx));
  
};
