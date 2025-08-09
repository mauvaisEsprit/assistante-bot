const pajemploiHandler = require('../handlers/pajemploiHandler');
const sessionAuthMiddleware = require('../middleware/sessionAuthMiddleware');

module.exports = (bot) => {
  bot.action(/^pajemploi_([a-f\d]{24})$/,sessionAuthMiddleware, pajemploiHandler.selectMonth);
  bot.action(/^pajemploi_month_([a-f\d]{24})_(\d{4}-\d{2})$/,sessionAuthMiddleware, pajemploiHandler.generatePdf);
};
