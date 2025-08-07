const { Markup } = require('telegraf');

module.exports = function pajemploiKeyboard(childId) {

  return Markup.inlineKeyboard([
    [Markup.button.callback('📄 Générer PDF Pajemploi', `pajemploi_${childId}`)]
  ]);
};
