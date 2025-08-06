const Child = require('../models/Child');
const getChildActionsKeyboard = require('../keyboards/childActionsKeyboard');

module.exports = async (ctx) => {
  let childId = ctx.callbackQuery.data
    .replace(/^child_/, '')
    .replace(/^menu_/, '');

  if (!/^[a-f\d]{24}$/i.test(childId)) {
    return ctx.answerCbQuery('ID enfant invalide', { show_alert: true });
  }

  const child = await Child.findById(childId).lean();
  if (!child) {
    return ctx.answerCbQuery('Enfant non trouvé', { show_alert: true });
  }

  const keyboard = getChildActionsKeyboard(child._id);

  await ctx.editMessageText(
    `👶 *${child.name}*\n\n💶 Tarif horaire : €${child.hourlyRate}\n🍽️ Repas : €${child.mealRate}\n🧼 Service : €${child.serviceRate}\nLimite d’heures par semaine : ${child.overtimeThreshold} \nMultiplicateur des heures supplémentaires : ${child.overtimeMultiplier} `,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.reply_markup,
    }
  );
};
