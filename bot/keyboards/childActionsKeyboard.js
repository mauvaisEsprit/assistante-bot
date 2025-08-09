const { Markup } = require('telegraf');
const Visit = require('../models/Visit');

module.exports = async (childId, role) => {
  if (role === 'admin') {
    // Проверяем, есть ли незавершённый визит (без endTime)
    const lastVisit = await Visit.findOne({ childId, endTime: { $exists: false } }).lean();

    const checkButton = lastVisit
      ? [{ text: '⏰ Check Out', callback_data: `check_out_${childId}` }]
      : [{ text: '🕒 Check In', callback_data: `check_in_${childId}` }];

    return Markup.inlineKeyboard([
      checkButton,
      [{ text: '📅 Ajouter des heures', callback_data: `add_hours_${childId}` }],
      [{ text: '📜 Historique', callback_data: `history_months_${childId}` }],
      [{ text: '✏️ Modifier', callback_data: `edit_prices_${childId}` }],
      [{ text: '📄 Générer PDF Pajemploi', callback_data: `pajemploi_${childId}` }],
      [{ text: '🔙 Retour', callback_data: 'select_child' }],
    ]);
  } else {
    // Для родителей показываем только Историю и кнопку Выйти (или Назад)
    return Markup.inlineKeyboard([
      [{ text: '📜 Historique', callback_data: `history_months_${childId}` }],
      [{ text: '📄 Générer PDF Pajemploi', callback_data: `pajemploi_${childId}` }],
      [{ text: '🔙 Log out', callback_data: 'logout' }],
    ]);
  }
};
