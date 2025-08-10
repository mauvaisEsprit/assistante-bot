const { Markup } = require('telegraf');
const moment = require('moment');
require('moment/locale/fr');  // подключаем французскую локаль

moment.locale('fr');  // переключаем локаль на французский

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = (childId) => {
  if (childId.startsWith('menu_')) {
    childId = childId.slice(5);
  }

  const monthButtons = [];
  const now = moment();

  for (let i = 0; i < 6; i++) {
    const m = now.clone().subtract(i, 'months');
    // разбиваем месяц и год, капитализируем месяц отдельно
    const month = capitalizeFirstLetter(m.format('MMMM'));
    const year = m.format('YYYY');
    const text = `${month} ${year}`;
    const value = m.format('YYYY-MM');
    monthButtons.push(Markup.button.callback(text, `add_month_${childId}_${value}`));
  }

  const rows = [];
  while (monthButtons.length) {
    rows.push(monthButtons.splice(0, 3));
  }

  rows.push([Markup.button.callback('🔙 Retour', `child_menu_${childId}`)]);

  return Markup.inlineKeyboard(rows);
};
