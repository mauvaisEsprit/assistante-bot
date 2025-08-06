const { Markup } = require('telegraf');
const moment = require('moment');

module.exports = (childId) => {


  // удаляем возможный лишний префикс
  if (childId.startsWith('menu_')) {
    childId = childId.slice(5);

  }

  const monthButtons = [];
  const now = moment();

  for (let i = 0; i < 12; i++) {
    const m = now.clone().subtract(i, 'months');
    const text = m.format('MMMM YYYY');
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
