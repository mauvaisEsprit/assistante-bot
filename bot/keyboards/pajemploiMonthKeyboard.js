const { Markup } = require('telegraf');

module.exports = function pajemploiMonthKeyboard(childId, months) {

  const buttons = months.map(m => [
    Markup.button.callback(
      m, 
      `pajemploi_month_${childId}_${m}`
    )
  ]);

  return Markup.inlineKeyboard(buttons).reply_markup;
};
