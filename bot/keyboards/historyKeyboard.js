const { Markup } = require('telegraf');

function monthsKeyboard(childId, months) {
  const buttons = months.map(m => [
    {
      text: m.format('MMMM YYYY'),
      callback_data: `history_dates_${childId}_${m.format('YYYY-MM')}`
    }
  ]);

  // Кнопка "Retour" вместо "Назад"
  buttons.push([{ text: '🔙 Retour', callback_data: `child_menu_${childId}` }]);

  return Markup.inlineKeyboard(buttons);
}

function datesKeyboard(childId, yearMonth, dates) {
  const buttons = dates.map(date => [
    {
      text: date.split('-')[2], // только число
      callback_data: `history_day_${childId}_${date}`
    }
  ]);

  // Кнопка "Retour aux mois" вместо "Назад к списку месяцев"
  buttons.push([{ text: '🔙 Retour aux mois', callback_data: `history_months_${childId}` }]);

  return Markup.inlineKeyboard(buttons);
}

function visitsBackKeyboard(childId, yearMonth) {
  return Markup.inlineKeyboard([
    [{ text: '🔙 Retour', callback_data: `history_dates_${childId}_${yearMonth}` }]
  ]);
}

module.exports = {
  monthsKeyboard,
  datesKeyboard,
  visitsBackKeyboard
};
