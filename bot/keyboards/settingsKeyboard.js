const { Markup } = require('telegraf');

module.exports = () => {
  return Markup.inlineKeyboard([
    [{ text: '➕ Ajouter un enfant', callback_data: 'add_child' }],
    [{ text: '🗑️ Supprimer un enfant', callback_data: 'delete_child' }],
    [{ text: '🏠 Menu principal', callback_data: 'back_to_main' }],
  ]).reply_markup;
};
