const childrenListHandler = require('../handlers/childrenListHandler');

module.exports = (bot) => {
  bot.action('select_child', childrenListHandler);
};
