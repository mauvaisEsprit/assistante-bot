const { Markup } = require('telegraf');

function hourKeyboard(prefix, childId, dateStr, startTime = '') {
  const buttons = [];

  for (let h = 0; h < 24; h++) {
    const hourStr = h.toString().padStart(2, '0');
    const data = startTime
      ? `${prefix}_hour_${childId}_${dateStr}_${startTime}_${hourStr}`
      : `${prefix}_hour_${childId}_${dateStr}_${hourStr}`;

    buttons.push(Markup.button.callback(hourStr, data));
  }

  // Diviser en lignes de 6 boutons
  const rows = [];
  while (buttons.length) {
    rows.push(buttons.splice(0, 6));
  }

  // Bouton "⬅ Retour aux enfants"
  rows.push([Markup.button.callback('⬅ Retour', `child_menu_${childId}`)]);

  return Markup.inlineKeyboard(rows);
}

function minutesKeyboard(prefix, childId, dateStr, startTime, hour) {
  const minuteButtons = ['00', '15', '30', '45'].map(min =>
    Markup.button.callback(
      min,
      `${prefix}_minute_${childId}_${dateStr}_${startTime}_${hour}_${min}`
    )
  );

  // Diviser en lignes de 4 boutons
  const rows = [];
  while (minuteButtons.length) {
    rows.push(minuteButtons.splice(0, 4));
  }

  // Bouton "⬅ Retour aux enfants"
  rows.push([Markup.button.callback('⬅ Retour', `child_menu_${childId}`)]);

  return Markup.inlineKeyboard(rows);
}

module.exports = { hourKeyboard, minutesKeyboard };
