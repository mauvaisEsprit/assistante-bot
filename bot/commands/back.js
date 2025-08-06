const startHandler = require("../handlers/startHandler");
const childrenListHandler = require("../handlers/childrenListHandler");
const getChildActionsKeyboard = require("../keyboards/childActionsKeyboard");
const Child = require("../models/Child");

module.exports = (bot) => {
  bot.action("back_to_main", async (ctx) => {
    await ctx.answerCbQuery();
    await startHandler(ctx);
  });

  bot.action("select_child", async (ctx) => {
    await ctx.answerCbQuery();
    await childrenListHandler(ctx);
  });

  bot.action(/child_menu_(.+)/, async (ctx) => {
    let rawId = ctx.match[1] || "";

    // всегда убираем префикс menu_
    rawId = rawId.replace(/^menu_/, "");

    // проверка, что осталось ровно 24 hex-символа
    if (!/^[a-f\d]{24}$/i.test(rawId)) {
      return ctx.answerCbQuery("ID enfant invalide", { show_alert: true });
    }

    const child = await Child.findById(rawId).lean();
    if (!child) {
      return ctx.answerCbQuery("Enfant non trouvé", { show_alert: true });
    }

    const keyboard = getChildActionsKeyboard(child._id);

    await ctx.reply(
      `👶 *${child.name}*\n\n💶 Tarif horaire : €${child.hourlyRate}\n🍽️ Repas : €${child.mealRate}\n🧼 Service : €${child.serviceRate}\nLimite d’heures par semaine : ${child.overtimeThreshold} \nMultiplicateur des heures supplémentaires : ${child.overtimeMultiplier} `,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup,
      }
    );
  });
};
