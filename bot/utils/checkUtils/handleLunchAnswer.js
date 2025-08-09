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
