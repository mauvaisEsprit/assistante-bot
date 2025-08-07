const Child = require("../models/Child");
const getChildActionsKeyboard = require("../keyboards/childActionsKeyboard");
const authorizedUsers = require("../utils/authStore"); // файл, где у тебя Map хранится

module.exports = async (ctx) => {
  let childId = ctx.callbackQuery.data
    .replace(/^child_/, "")
    .replace(/^menu_/, "");

  if (!/^[a-f\d]{24}$/i.test(childId)) {
    return ctx.answerCbQuery("ID enfant invalide", { show_alert: true });
  }

  const child = await Child.findById(childId).lean();
  if (!child) {
    return ctx.answerCbQuery("Enfant non trouvé", { show_alert: true });
  }

  const auth = authorizedUsers.get(ctx.from.id);
  const keyboard = getChildActionsKeyboard(child._id, auth.role);

  await ctx.reply(
    `👶 *${child.name}*\n\n💶 Tarif horaire : €${child.hourlyRate}\n🍽️ Repas : €${child.mealRate}\n🧼 Service : €${child.serviceRate}\nLimite d’heures par semaine : ${child.overtimeThreshold} \nMultiplicateur des heures supplémentaires : ${child.overtimeMultiplier} `,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard.reply_markup,
    }
  );
};
