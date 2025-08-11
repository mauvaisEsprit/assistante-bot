const { session } = require('telegraf');
const addHoursHandler = require('../handlers/addHoursHandler');
const Visit = require('../models/Visit');
const sessionAuthMiddleware = require('../middleware/sessionAuthMiddleware');


module.exports = (bot) => {
  bot.action(/^add_hours_(.+)$/,sessionAuthMiddleware, async (ctx) => {
    await ctx.answerCbQuery();
    await addHoursHandler.startAddHours(ctx, ctx.match[1]);
  });
  bot.action(/^add_month_([a-f\d]{24})_(\d{4}-\d{2})$/,sessionAuthMiddleware, async (ctx) => {
    await ctx.answerCbQuery();
    await addHoursHandler.selectMonth(ctx, ctx.match[1], ctx.match[2]);
  });
  bot.action(/^add_day_([a-f\d]{24})_(\d{4}-\d{2}-\d{2})$/,sessionAuthMiddleware, async (ctx) => {
    await ctx.answerCbQuery();
    await addHoursHandler.selectDate(ctx, ctx.match[1], ctx.match[2]);
  });  

  bot.action(/^start_hour_([a-f\d]{24})_(\d{4}-\d{2}-\d{2})_(\d{2})$/,sessionAuthMiddleware, async (ctx) => { 
    await ctx.answerCbQuery();
    await addHoursHandler.selectStartHour(ctx, ctx.match[1], ctx.match[2], ctx.match[3]);
  });  
  bot.action(/^start_minute_([a-f\d]{24})_(\d{4}-\d{2}-\d{2})_(.*?)_(\d{2})_(\d{2})$/,sessionAuthMiddleware, async (ctx) => {
    await ctx.answerCbQuery();
    await addHoursHandler.selectStartMinute(ctx, ctx.match[1], ctx.match[2], ctx.match[3], ctx.match[4], ctx.match[5]);
  }); 

  bot.action(/^end_hour_([a-f\d]{24})_(\d{4}-\d{2}-\d{2})_(.*?)_(\d{2})$/,sessionAuthMiddleware, async (ctx) => {
    await ctx.answerCbQuery();
    await addHoursHandler.selectEndHour(ctx, ctx.match[1], ctx.match[2], ctx.match[3], ctx.match[4]);
  });  
  bot.action(/^end_minute_([a-f\d]{24})_(\d{4}-\d{2}-\d{2})_(.*?)_(\d{2})_(\d{2})$/,sessionAuthMiddleware, async (ctx) => { 
    await ctx.answerCbQuery();
    await addHoursHandler.selectEndMinute(ctx, ctx.match[1], ctx.match[2], ctx.match[3], ctx.match[4], ctx.match[5]);
  });  
  bot.action("lunch_yes",sessionAuthMiddleware, async (ctx) => {
    await ctx.answerCbQuery();
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

  bot.action("lunch_no",sessionAuthMiddleware, async (ctx) => {
    await ctx.answerCbQuery();
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
