const getMainMenuKeyboard = require('../keyboards/mainMenuKeyboard');

module.exports = async (ctx) => {
  const keyboard = await getMainMenuKeyboard();

  ctx.reply('Menu principal :', {
    reply_markup: keyboard
  });
};
