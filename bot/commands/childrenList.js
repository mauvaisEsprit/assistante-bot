const childrenListHandler = require('../handlers/childrenListHandler');
const sessionAuthMiddleware = require('../middleware/sessionAuthMiddleware');

module.exports = (bot) => {
  bot.action('select_child',sessionAuthMiddleware, childrenListHandler);
};
