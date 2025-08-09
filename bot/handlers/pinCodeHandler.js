const Child = require("../models/Child");
const Session = require("../models/Session");
require("dotenv").config();
const startHandler = require("../handlers/startHandler");
const childActionsKeyboard = require("../keyboards/childActionsKeyboard");
const addChildHandler = require("./addChildHandler");
const editPriceHandler = require("./editPriceHandler");

module.exports = (bot) => {
  bot.start(async (ctx) => {
  const telegramId = ctx.from.id;
  let session = await Session.findOne({ telegramId }).lean();

  if (session && session.expiresAt < Date.now()) {
    await Session.deleteOne({ _id: session._id });
    session = null;
  }

  if (!session) {
    return ctx.reply("🔐 Veuillez saisir votre code PIN :");
  }

  // Session active — afficher le menu selon le rôle
  if (session.role === "admin") {
    await ctx.reply("✅ Vous êtes connecté en tant qu’administrateur.");
    return startHandler(ctx);
  }

  if (session.role === "parent" && session.childId) {
    const child = await Child.findById(session.childId).lean();
    if (!child) {
      await ctx.reply("❌ Enfant introuvable. Veuillez vous reconnecter.");
      await Session.deleteOne({ telegramId });
      return ctx.reply("🔐 Veuillez saisir votre code PIN :");
    }

    const keyboard = childActionsKeyboard(child._id, "parent");
    return ctx.reply(
      `✅ Vous êtes connecté en tant que parent de l’enfant ${child.name}\n\n👶 *${child.name}*\n💶 Tarif horaire : €${child.hourlyRate}\n🍽️ Repas : €${child.mealRate}\n🧼 Service : €${child.serviceRate}`,
      { parse_mode: "Markdown", reply_markup: keyboard.reply_markup }
    );
  }

  // Rôle inconnu — forcer la reconnexion
  await Session.deleteOne({ telegramId });
  return ctx.reply("🔐 Veuillez saisir votre code PIN :");
});


  bot.on("text", async (ctx) => {
    const telegramId = ctx.from.id;

    // Vérifier session active
    let session = await Session.findOne({ telegramId }).lean();
    if (session && session.expiresAt < Date.now()) {
      await Session.deleteOne({ _id: session._id });
      session = null;
    }

    if (!session) {
      // Pas de session : on attend un PIN
      const pin = ctx.message.text.trim();

      if (pin === process.env.ADMIN_PIN) {
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await Session.findOneAndUpdate(
          { telegramId },
          { role: "admin", expiresAt },
          { upsert: true }
        );
        await ctx.reply("✅ Vous êtes connecté en tant qu’administrateur.");
        return startHandler(ctx);
      }

      const child = await Child.findOne({ pinCode: pin }).lean();
      if (child) {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await Session.findOneAndUpdate(
          { telegramId },
          { role: "parent", childId: child._id, expiresAt },
          { upsert: true }
        );

        const keyboard = childActionsKeyboard(child._id, "parent");

        return ctx.reply(
          `✅ Vous êtes connecté en tant que parent de ${child.name}\n\n👶 *${child.name}*\n💶 Tarif horaire : €${child.hourlyRate}\n🍽️ Repas : €${child.mealRate}\n🧼 Service : €${child.serviceRate}\n`,
          { parse_mode: "Markdown", reply_markup: keyboard.reply_markup }
        );
      }

      return ctx.reply("❌ PIN incorrect. Veuillez réessayer.");
    }

    // Session active — gérer les autres modes
    const userId = telegramId;

    if (await addChildHandler.isAdding(userId)) {
      return addChildHandler.processInputStart(ctx);
    } else if (await editPriceHandler.isEditing(userId)) {
      return editPriceHandler.processInput(ctx);
    } else {
      // Sinon message par défaut
      return ctx.reply("❓ Commande ou action inconnue. Utilisez le menu.");
    }
  });

   bot.action("logout", async (ctx) => {
  await Session.deleteOne({ telegramId: ctx.from.id });
  await ctx.answerCbQuery("Vous avez été déconnecté.");
  await ctx.reply("👋 Vous êtes bien déconnecté. Pour vous reconnecter, veuillez saisir votre code PIN.");
});

};
