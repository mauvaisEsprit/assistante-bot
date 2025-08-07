const pajemploiHandler = require('../handlers/pajemploiHandler');

module.exports = (bot) => {
  bot.action(/^pajemploi_([a-f\d]{24})$/, pajemploiHandler.selectMonth);
  bot.action(/^pajemploi_month_([a-f\d]{24})_(\d{4}-\d{2})$/, pajemploiHandler.generatePdf);
};
