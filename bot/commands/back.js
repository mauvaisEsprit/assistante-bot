const startHandler = require("../handlers/startHandler");
const childrenListHandler = require("../handlers/childrenListHandler");
const getChildActionsKeyboard = require("../keyboards/childActionsKeyboard");
const Child = require("../models/Child");
const Session = require("../models/Session");
const sessionAuthMiddleware = require("../middleware/sessionAuthMiddleware");

module.exports = (bot) => {
  bot.action("back_to_main",sessionAuthMiddleware, async (ctx) => {
    await ctx.answerCbQuery();
    await startHandler(ctx);
  });

  bot.action('select_child',sessionAuthMiddleware, async (ctx) => {
    const session = await Session.findOne({ telegramId: ctx.from.id }).lean();
    
      if (!session || session.expiresAt < Date.now()) {
        return ctx.answerCbQuery("Veuillez vous reconnecter", { show_alert: true });
      }
      const auth = session.role;
    
    
    if (!auth) {
      return ctx.answerCbQuery('Veuillez vous connecter, s’il vous plaît.', { show_alert: true });
    }

    if (auth.role === 'admin') {
      // Показываем список всех детей с возможностью редактирования и т.п.
      await childrenListHandler(ctx);
    } else {
      // Родитель может видеть только своего ребенка
      const child = await Child.findById(auth.childId).lean();
      if (!child) return ctx.reply('Enfant introuvable.');

      const keyboard = getChildActionsKeyboard(child._id, auth.role);
      await ctx.reply(`👶 ${child.name}`, {
        reply_markup: keyboard.reply_markup,
      });
    }
  });

  bot.action(/child_menu_(.+)/,sessionAuthMiddleware, async (ctx) => {
    const childIdFromButton = ctx.match[1];
    const session = await Session.findOne({ telegramId: ctx.from.id }).lean();
    
      if (!session || session.expiresAt < Date.now()) {
        return ctx.answerCbQuery("Veuillez vous reconnecter", { show_alert: true });
      }
      const auth = session.role;

    if (!auth) {
      return ctx.answerCbQuery("⛔ Vous n'êtes pas autorisé", { show_alert: true });
    }

    if (auth.role === "admin") {
      // админ видит любое меню
    } else if (auth.role === "child") {
      if (auth.childId.toString() !== childIdFromButton) {
        return ctx.answerCbQuery("⛔ Pas d'accès à cet enfant", { show_alert: true });
      }
    }

    const child = await Child.findById(childIdFromButton).lean();
    if (!child) {
      return ctx.answerCbQuery("Enfant non trouvé", { show_alert: true });
    }

    const keyboard = getChildActionsKeyboard(child._id, auth.role); 
    // можно передать роль, чтобы убрать лишние кнопки для родителей
    await ctx.reply(
      `👶 *${child.name}*\n\n💶 Tarif horaire : €${child.hourlyRate}\n🍽️ Repas : €${child.mealRate}\n🧼 Service : €${child.serviceRate}\nLimite d’heures par semaine : ${child.overtimeThreshold} \nMultiplicateur des heures supplémentaires : ${child.overtimeMultiplier} `,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard.reply_markup,
      }
    );
  });
};
