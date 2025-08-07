const Visit = require('../models/Visit');
const monthsKeyboard = require('../keyboards/monthsKeyboard');
const daysKeyboard = require('../keyboards/daysKeyboard');
const { hourKeyboard, minutesKeyboard } = require('../keyboards/timesKeyboard');


module.exports = {
  async startAddHours(ctx) {
    const childId = ctx.match[1];
    ctx.session = ctx.session || {};
    ctx.session.selectedChildId = childId;

    await ctx.answerCbQuery();
    await ctx.reply('Choisissez un mois :', monthsKeyboard(childId));
  },

  async selectMonth(ctx) {
    const childId = ctx.match[1];
    const yearMonth = ctx.match[2];
    const [year, month] = yearMonth.split('-');

    ctx.session.selectedChildId = childId;

    await ctx.answerCbQuery();
    await ctx.reply(`Choisissez un jour en ${month}.${year} :`, daysKeyboard(year, month, childId));
  },

  async selectDate(ctx) {
    const childId = ctx.match[1];
    const dateStr = ctx.match[2];

    ctx.session.selectedDate = dateStr;

    await ctx.answerCbQuery();
    await ctx.reply(`Choisissez l'heure de début pour le ${dateStr} :`, hourKeyboard('start', childId, dateStr));
  },

  async selectStartHour(ctx) {
    const childId = ctx.match[1];
    const dateStr = ctx.match[2];
    const hour = ctx.match[3];

    ctx.session.selectedStartHour = hour;

    await ctx.answerCbQuery();
    await ctx.reply(
      `Choisissez les minutes de début pour le ${dateStr} à ${hour}h :`,
      minutesKeyboard('start', childId, dateStr, '', hour)
    );
  },

  async selectStartMinute(ctx) {
    const [, childId, dateStr, startTime, hour, minute] = ctx.match;
    const fullStartTime = `${hour}:${minute}`;
    ctx.session.startTime = fullStartTime;

    await ctx.answerCbQuery();
    await ctx.reply(
      `🕓 Début : ${fullStartTime}\nMaintenant, choisissez l'heure de fin :`,
      hourKeyboard('end', childId, dateStr, fullStartTime)
    );
  },

  async selectEndHour(ctx) {
    const childId = ctx.match[1];
    const dateStr = ctx.match[2];
    const startTime = ctx.match[3];
    const hour = ctx.match[4];

    ctx.session.selectedEndHour = hour;

    await ctx.answerCbQuery();
    await ctx.reply(
      `Choisissez les minutes de fin pour le ${dateStr} à ${hour}h :`,
      minutesKeyboard('end', childId, dateStr, startTime, hour)
    );
  },

  async selectEndMinute(ctx) {
    const childId = ctx.match[1];
    const dateStr = ctx.match[2];
    const startTime = ctx.match[3];
    const hour = ctx.match[4];
    const minute = ctx.match[5];

    const endTime = `${hour}:${minute}`;

    // Enregistré temporairement en session, pour ensuite demander si l'enfant a déjeuné et sauvegarder en base
    ctx.session.pendingVisit = {
      childId,
      date: dateStr,
      startTime,
      endTime
    };

    await ctx.answerCbQuery();
    await ctx.reply(
      "🍽 L'enfant a-t-il déjeuné ?",
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Oui", callback_data: "lunch_yes" },
              { text: "❌ Non", callback_data: "lunch_no" }
            ]
          ]
        }
      }
    );
  }

};
