const { Markup } = require('telegraf');

module.exports = () => {
  return Markup.inlineKeyboard([
    [{ text: '👧 Liste d’enfants', callback_data: 'select_child' }],
    [{ text: '⚙️ Paramètres', callback_data: 'open_settings' }],
    [{ text: '🔙 Log out', callback_data: 'logout' }],
  ]).reply_markup;
};
