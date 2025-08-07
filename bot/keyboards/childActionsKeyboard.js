const { Markup } = require('telegraf');

module.exports = (childId, role) => {
  if (role === 'admin') {
    return Markup.inlineKeyboard([
      [{ text: '📅 Ajouter des heures', callback_data: `add_hours_${childId}` }],
      [{ text: '📜 Historique', callback_data: `history_months_${childId}` }],
      [{ text: '✏️ Modifier', callback_data: `edit_prices_${childId}` }],
      [{ text: '📄 Générer PDF Pajemploi', callback_data: `pajemploi_${childId}`}],
      [{ text: '🔙 Retour', callback_data: 'select_child' }],
    ]);
  } else  {
    // Для родителей показываем только Историю и кнопку Выйти (или Назад)
    return Markup.inlineKeyboard([
      [{ text: '📜 Historique', callback_data: `history_months_${childId}` }],
      [{ text: '📄 Générer PDF Pajemploi', callback_data: `pajemploi_${childId}`}],
      [{ text: '🔙 Log out', callback_data: 'logout' }], // или 'select_child' если хочешь вернуть к списку детей
    ]);
  }
};
