const { Markup } = require('telegraf');

module.exports = () => {
  return Markup.inlineKeyboard([
    [{ text: '👧 Liste d’enfants', callback_data: 'select_child' }],
    [{ text: '⚙️ Paramètres', callback_data: 'open_settings' }],
  ]).reply_markup;
};
