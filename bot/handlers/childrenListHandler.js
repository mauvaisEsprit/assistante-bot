const getChildrenListKeyboard = require('../keyboards/childrenListKeyboard');


module.exports = async (ctx) => {
  const keyboard = await getChildrenListKeyboard();

  await ctx.reply('👧 Choisissez :', keyboard);
};
