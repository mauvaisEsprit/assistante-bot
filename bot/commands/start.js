const addChildHandler = require("../handlers/addChildHandler");
const editPriceHandler = require("../handlers/editPriceHandler");
const Child = require("../models/Child");
const getSettingsKeyboard = require("../keyboards/settingsKeyboard");
const sessionAuthMiddleware = require("../middleware/sessionAuthMiddleware");

module.exports = (bot) => {
  bot.action("add_child",sessionAuthMiddleware, async (ctx) => {
    await addChildHandler.startAddChild(ctx);
  });

  bot.action("cancel_add_child",sessionAuthMiddleware, async (ctx) => {
    await addChildHandler.cancelAddChild(ctx);
  });

  bot.action("open_settings",sessionAuthMiddleware, async (ctx) => {
    const settingsKeyboard = require("../keyboards/settingsKeyboard")();
    await ctx.reply("⚙️ Paramètres :", { reply_markup: settingsKeyboard });
  });

  // Suppression d’un enfant — liste
  bot.action("delete_child",sessionAuthMiddleware, async (ctx) => {
    const children = await Child.find().lean();

    if (children.length === 0) {
      return ctx.answerCbQuery("Aucun enfant à supprimer", {
        show_alert: true,
      });
    }

    const buttons = children.map((child) => [
      {
        text: child.name,
        callback_data: `delete_child_select_${child._id}`,
      },
    ]);

    buttons.push([{ text: "🔙 Retour", callback_data: "open_settings" }]);

    await ctx.reply("Sélectionnez un enfant à supprimer :", {
      reply_markup: { inline_keyboard: buttons },
    });
  });

  // Confirmation de suppression
  bot.action(/^delete_child_select_(.+)$/,sessionAuthMiddleware, async (ctx) => {
    const childId = ctx.match[1];

    const child = await Child.findById(childId).lean();
    if (!child) {
      return ctx.answerCbQuery("Enfant introuvable", { show_alert: true });
    }

    await ctx.reply(
      `Voulez-vous vraiment supprimer l'enfant "${child.name}" ? Cette action est irréversible.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Oui, supprimer",
                callback_data: `delete_child_confirm_${childId}`,
              },
              { text: "❌ Annuler", callback_data: "delete_child" },
            ],
          ],
        },
      }
    );
  });

  // Exécution de la suppression
  bot.action(/^delete_child_confirm_(.+)$/,sessionAuthMiddleware, async (ctx) => {
    const childId = ctx.match[1];

    try {
      await Child.findByIdAndDelete(childId);
      await ctx.answerCbQuery("Enfant supprimé");

      await ctx.reply("Enfant supprimé. Menu des paramètres :", {
        reply_markup: getSettingsKeyboard(),
      });
    } catch (e) {
      console.error(e);
      await ctx.answerCbQuery("Erreur lors de la suppression de l'enfant", {
        show_alert: true,
      });
    }
  });
};
