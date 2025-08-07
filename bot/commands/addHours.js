const addHoursHandler = require('../handlers/addHoursHandler');
const Visit = require('../models/Visit');



module.exports = (bot) => {
  bot.action(/^add_hours_(.+)$/, addHoursHandler.startAddHours);
  bot.action(/^add_month_([a-f\d]{24})_(\d{4}-\d{2})$/, addHoursHandler.selectMonth);
  bot.action(/^add_day_([a-f\d]{24})_(\d{4}-\d{2}-\d{2})$/, addHoursHandler.selectDate);

  bot.action(/^start_hour_([a-f\d]{24})_(\d{4}-\d{2}-\d{2})_(\d{2})$/, addHoursHandler.selectStartHour);
  bot.action(/^start_minute_([a-f\d]{24})_(\d{4}-\d{2}-\d{2})_(.*?)_(\d{2})_(\d{2})$/, addHoursHandler.selectStartMinute);

  bot.action(/^end_hour_([a-f\d]{24})_(\d{4}-\d{2}-\d{2})_(.*?)_(\d{2})$/, addHoursHandler.selectEndHour);
  bot.action(/^end_minute_([a-f\d]{24})_(\d{4}-\d{2}-\d{2})_(.*?)_(\d{2})_(\d{2})$/, addHoursHandler.selectEndMinute);

  bot.action("lunch_yes", async (ctx) => {
    if (!ctx.session.pendingVisit) return ctx.answerCbQuery("Pas de données à enregistrer");

    const visit = new Visit({
      ...ctx.session.pendingVisit,
      hadLunch: true
    });
    await visit.save();

    await ctx.reply(
      `✅ Visite enregistrée :\n📅 ${visit.date}\n🕒 De ${visit.startTime} à ${visit.endTime}\n🍽 Déjeuner : Oui`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅ Retour aux enfants", callback_data: "select_child" }]
          ]
        }
      }
    );

    delete ctx.session.pendingVisit;
  });

  bot.action("lunch_no", async (ctx) => {
    if (!ctx.session.pendingVisit) return ctx.answerCbQuery("Pas de données à enregistrer");

    const visit = new Visit({
      ...ctx.session.pendingVisit,
      hadLunch: false
    });
    await visit.save();

    await ctx.reply(
      `✅ Visite enregistrée :\n📅 ${visit.date}\n🕒 De ${visit.startTime} à ${visit.endTime}\n🍽 Déjeuner : Non`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅ Retour aux enfants", callback_data: "select_child" }]
          ]
        }
      }
    );

    delete ctx.session.pendingVisit;
  });
};
