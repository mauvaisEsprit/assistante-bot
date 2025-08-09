const Visit = require('../../models/Visit');
const moment = require('moment');

async function checkIn(ctx) {
  const childId = ctx.match[1]; // из callback_data например checkin_<childId>

  // Текущая дата и время
  const now = moment();
  const date = now.format('YYYY-MM-DD');
  const startTime = now.format('HH:mm');

  // Проверим, нет ли уже незакрытого визита для этого ребенка на сегодня
  const existingVisit = await Visit.findOne({ childId, date, endTime: { $exists: false } });
  if (existingVisit) {
    return ctx.reply('⚠️ Для этого ребёнка уже есть открытый визит на сегодня. Сначала сделайте чек-аут.');
  }

  const visit = new Visit({
    childId,
    date,
    startTime,
  });

  await visit.save();

  await ctx.reply(`✅ Чек-ин зафиксирован: ${date} ${startTime}`);
}

module.exports = checkIn;