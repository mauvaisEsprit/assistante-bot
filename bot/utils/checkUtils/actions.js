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

async function handleLunchAnswer(ctx) {
  const answer = ctx.callbackQuery.data; // lunch_yes или lunch_no
  const hadLunch = answer === 'lunch_yes';

  const visitId = ctx.session.lastVisitId;
  if (!visitId) {
    await ctx.answerCbQuery('❌ Ошибка: данные визита не найдены.');
    return;
  }

  await Visit.findByIdAndUpdate(visitId, { hadLunch });

  delete ctx.session.lastVisitId;

  await ctx.answerCbQuery();
  await ctx.reply(`✅ Информация о приёме пищи сохранена: ${hadLunch ? 'да' : 'нет'}`);
}


module.exports = checkIn;
module.exports = checkOut;
module.exports = handleLunchAnswer;