const editPriceHandler = require('../handlers/editPriceHandler');
const getChildEditPricesKeyboard = require('../keyboards/childEditPricesKeyboard.js');

module.exports = (bot) => {
  // При нажатии "Редактировать цены" показываем клавиатуру 
  bot.action(/edit_prices_(.+)/, async (ctx) => {
    console.log('red');
    const childId = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(getChildEditPricesKeyboard(childId));
  });

  // Обработка выбора поля для редактирования (час, еда, обслуживание)
  bot.action(/edit_price_(hourly|meal|service|overtimeThreshold|overtimeMultiplier|name)_.+/, async (ctx) => { 
    console.log('menu');
    await editPriceHandler.startEditing(ctx);
  });

  // Обработка нажатия кнопки "Отмена"
  bot.action(/cancel_edit_.+/, (ctx) => editPriceHandler.cancelEditing(ctx));

  
 
};
