const moment = require('moment');
const Visit = require('../../models/Visit');

async function checkOut(ctx) {
  const childId = ctx.match[1];
  const now = moment();
  const date = now.format('YYYY-MM-DD');
  const endTime = now.format('HH:mm');

  // Найдём открытый визит сегодня для этого ребенка
  const visit = await Visit.findOne({ childId, date, endTime: { $exists: false } });
  if (!visit) {
    return ctx.reply('⚠️ Нет открытого визита на сегодня для этого ребёнка. Сначала сделайте чек-ин.');
  }

  visit.endTime = endTime;
  await visit.save();

  // Сохраним в сессии айди визита, чтобы при ответе про обед обновить его
  ctx.session.lastVisitId = visit._id;

  await ctx.reply(
    `✅ Чек-аут зафиксирован: ${date} ${endTime}\nРебёнок обедал?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Да', callback_data: 'lunch_yes' },
            { text: '❌ Нет', callback_data: 'lunch_no' },
          ],
        ],
      },
    }
  );
}

module.exports = checkOut;