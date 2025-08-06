const childSelectHandler = require('../handlers/childSelectHandler');

module.exports = (bot) => {
  bot.action(/^child_/, (ctx) => childSelectHandler(ctx));
  
};
