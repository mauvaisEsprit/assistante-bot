const Visit = require("../models/Visit");
const historyHandler = require("../handlers/historyHandler");
const sessionAuthMiddleware = require("../middleware/sessionAuthMiddleware");



module.exports = (bot) => {
  // Étape 1 — liste des mois
  bot.action(/^history_months_(\w{24})$/, sessionAuthMiddleware, async (ctx) => {
    await ctx.answerCbQuery();
    await historyHandler.showMonths(ctx);
  });

  // Étape 2 — liste des dates dans le mois
  bot.action(
    /^history_dates_(\w{24})_(\d{4}-\d{2})$/, sessionAuthMiddleware, async (ctx) => {
      await ctx.answerCbQuery();
      await historyHandler.showDates(ctx);
  });

  // Étape 3 — visites du jour
  bot.action(
    /^history_day_(\w{24})_(\d{4}-\d{2}-\d{2})$/, sessionAuthMiddleware,async (ctx) => {
      await ctx.answerCbQuery();
      await historyHandler.showVisitsForDate(ctx);
  });

  // Suppression — confirmation
  bot.action(/^delv_(.+)$/, sessionAuthMiddleware, async (ctx) => {
    await ctx.answerCbQuery();
    const visitId = ctx.match[1];
    const visit = await Visit.findById(visitId);

    if (!visit) {
      return ctx.answerCbQuery("Enregistrement non trouvé", { show_alert: true });
    }

    await ctx.answerCbQuery();

  await ctx.reply(
  `❗ Supprimer cet enregistrement ?\n📅 ${visit.date}\n🕒 ${visit.startTime} - ${visit.endTime ? visit.endTime : 'en cours'}`
  ,


      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Oui", callback_data: `confirm_delv_${visitId}` },
              { text: "❌ Non", callback_data: `history_day_${visit.childId}_${visit.date}` }
            ]
          ]
        }
      }
    );
  });

  // Suppression — exécution
  bot.action(/^confirm_delv_(.+)$/, sessionAuthMiddleware,  async (ctx) => {
  await ctx.answerCbQuery();
  const visitId = ctx.match[1];
  const visit = await Visit.findById(visitId);

  if (!visit) {
    return ctx.answerCbQuery("Enregistrement déjà supprimé", { show_alert: true });
  }

  const { childId, date } = visit;
  const yearMonth = date.slice(0, 7);

  // Удаляем запись
  await Visit.deleteOne({ _id: visitId });

  // Проверяем, остались ли визиты в месяце
  const remainingVisits = await Visit.find({
    childId,
    date: { $regex: `^${yearMonth}` }
  }).lean();

  // Проверяем, остались ли вообще визиты у ребёнка
  const totalVisits = await Visit.find({ childId }).lean();

  await ctx.answerCbQuery("✅ Enregistrement supprimé");

  await new Promise(resolve => setTimeout(resolve, 1000)); // небольшой таймаут

  if (remainingVisits.length > 0) {
    // Если есть визиты в этом месяце — показываем даты
    ctx.callbackQuery.data = `history_dates_${childId}_${yearMonth}`;
    await historyHandler.showDates(ctx);
  } else if (totalVisits.length > 0) {
    // В этом месяце визитов нет, но есть в других месяцах — показываем месяцы
    ctx.callbackQuery.data = `history_months_${childId}`;
    await historyHandler.showMonths(ctx);
  }  else {
  ctx.callbackQuery.data = `child_menu_${childId}`;
  const childSelectHandler = require('../handlers/childSelectHandler');
  await childSelectHandler(ctx);

  }
});


};
