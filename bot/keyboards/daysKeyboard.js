const { Markup } = require('telegraf');
const moment = require('moment');

module.exports = (year, month, childId) => {
  const daysInMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
  const dayButtons = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = day.toString().padStart(2, '0');
    dayButtons.push(
      Markup.button.callback(dayStr, `add_day_${childId}_${year}-${month}-${dayStr}`)
    );
  }

  // Разбиваем по 7 дней в строке
  const rows = [];
  while (dayButtons.length) {
    rows.push(dayButtons.splice(0, 7));
  }

  // Кнопка "Retour aux enfants"
  rows.push([Markup.button.callback('⬅ Retour', `child_menu_${childId}`)]);

  return Markup.inlineKeyboard(rows);
};
