const getChildrenListKeyboard = require('../keyboards/childrenListKeyboard');

module.exports = async (ctx) => {
  const keyboard = await getChildrenListKeyboard();

  ctx.reply('👧 Choisissez :', {
    reply_markup: keyboard
  });
};
