const editPriceHandler = require("../handlers/editPriceHandler");
const getChildEditPricesKeyboard = require("../keyboards/childEditPricesKeyboard.js");
const sessionAuthMiddleware = require("../middleware/sessionAuthMiddleware");

module.exports = (bot) => {
  // При нажатии "Редактировать цены" показываем клавиатуру
  bot.action(/edit_prices_(.+)/, sessionAuthMiddleware, async (ctx) => {
    const childId = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(getChildEditPricesKeyboard(childId));
  });

  // Обработка выбора поля для редактирования (час, еда, обслуживание)
  bot.action(
    /edit_price_(hourly|meal|service|overtimeThreshold|overtimeMultiplier|name)_.+/, sessionAuthMiddleware,
    async (ctx) => {
      await editPriceHandler.startEditing(ctx);
    }
  );

  // Обработка нажатия кнопки "Отмена"
  bot.action(/cancel_edit_.+/, sessionAuthMiddleware, (ctx) => editPriceHandler.cancelEditing(ctx));
};
