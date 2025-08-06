const { Markup } = require('telegraf');

module.exports = (childId) =>
  Markup.inlineKeyboard([
    [{ text: '📅 Ajouter des heures', callback_data: `add_hours_${childId}` }],
    [{ text: '📜 Historique', callback_data: `history_months_${childId}` }],
    [{ text: '✏️ Modifier', callback_data: `edit_prices_${childId}` }],
    [{ text: '🔙 Retour', callback_data: 'select_child' }],
  ]);
