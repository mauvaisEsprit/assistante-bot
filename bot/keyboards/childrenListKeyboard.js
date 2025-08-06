const { Markup } = require('telegraf');
const Child = require('../models/Child');

module.exports = async () => {
  const children = await Child.find().lean();

  const buttons = children.map(child => [{
    text: child.name,
    callback_data: `child_${child._id}`
  }]);

  // Объединяем кнопки детей + назад в один массив
  return Markup.inlineKeyboard([
    ...buttons,
    [{ text: '🔙 Retour', callback_data: 'back_to_main' }]
  ]).reply_markup;
};
