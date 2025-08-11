const Child = require("../models/Child");
const sessionService = require("../services/sessionService");
require("dotenv").config();
const startHandler = require("../handlers/startHandler");
const childActionsKeyboard = require("../keyboards/childActionsKeyboard");
const addChildHandler = require("./addChildHandler");
const editPriceHandler = require("./editPriceHandler");
const bcrypt = require("bcrypt");
const rateLimitForPin = require("../middleware/rateLimitForPin");
const { pinRateLimiter, attemptsMap } = require("../middleware/pinRateLimiter");

module.exports = (bot) => {
  bot.start(rateLimitForPin(10000), async (ctx) => {
    const telegramId = ctx.from.id;
    let session = await sessionService.getSession(telegramId);

    if (session && session.expiresAt < Date.now()) {
      await sessionService.deleteSession(telegramId);
      session = null;
    }

    if (!session) {
      return ctx.reply("🔐 Veuillez saisir votre code PIN :");
    }

    if (session.role === "admin") {
      await ctx.reply("✅ Vous êtes connecté en tant qu’administrateur.");
      return startHandler(ctx);
    }

    if (session.role === "parent" && session.childId) {
      const child = await Child.findById(session.childId).lean();
      if (!child) {
        await ctx.reply("❌ Enfant introuvable. Veuillez vous reconnecter.");
        await sessionService.deleteSession(telegramId);
        return ctx.reply("🔐 Veuillez saisir votre code PIN :");
      }

      const keyboard = childActionsKeyboard(child._id, "parent");
      return ctx.reply(
        `✅ Vous êtes connecté en tant que parent de l’enfant ${child.name}\n\n👶 *${child.name}*\n💶 Tarif horaire : €${child.hourlyRate}\n🍽️ Repas : €${child.mealRate}\n🧼 Service : €${child.serviceRate}`,
        { parse_mode: "Markdown", reply_markup: keyboard.reply_markup }
      );
    }

    await sessionService.deleteSession(telegramId);
    return ctx.reply("🔐 Veuillez saisir votre code PIN :");
  });

  async function findChildByPin(pin) {
    const children = await Child.find().lean();
    for (const child of children) {
      const match = await bcrypt.compare(pin, child.pinCode);
      if (match) return child;
    }
    return null;
  }

  const MAX_ATTEMPTS = 3;
  const BLOCK_TIME_MS = 1 * 60 * 1000; // 10 минут

  bot.on("text", rateLimitForPin(3000), pinRateLimiter, async (ctx) => {
  const telegramId = ctx.from.id;
  let session = await sessionService.getSession(telegramId);

  if (session && session.expiresAt < Date.now()) {
    await sessionService.deleteSession(telegramId);
    session = null;
  }

  if (!session) {
    const pin = ctx.message.text.trim();

    // Получаем или создаём объект попыток для пользователя
    let userData = attemptsMap.get(telegramId) || { failedAttempts: 0, blockedUntil: 0 };
    const now = Date.now();

    // Проверяем, заблокирован ли пользователь (этот момент можно оставить в pinRateLimiter, но тут для наглядности)
    if (userData.blockedUntil > now) {
      const waitMin = Math.ceil((userData.blockedUntil - now) / 60000);
      return ctx.reply(`⏳ Trop de tentatives bloquées. Réessayez dans ${waitMin} minute(s).`);
    }

    // Проверка пина админа
    if (pin === process.env.ADMIN_PIN) {
      attemptsMap.delete(telegramId); // сбросить счетчик после успеха
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await sessionService.updateSession(telegramId, {
        role: "admin",
        expiresAt,
      });
      await ctx.reply("✅ Vous êtes connecté en tant qu’administrateur.");
      return startHandler(ctx);
    }

    // Проверка пина ребенка
    const child = await findChildByPin(pin);
    if (child) {
      attemptsMap.delete(telegramId); // сбросить счетчик после успеха
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await sessionService.updateSession(telegramId, {
        role: "parent",
        childId: child._id,
        expiresAt,
      });

      const keyboard = await childActionsKeyboard(child._id, "parent");
      return ctx.reply(
        `✅ Vous êtes connecté en tant que parent de ${child.name}\n\n👶 *${child.name}*\n💶 Tarif horaire : €${child.hourlyRate}\n🍽 Repas : €${child.mealRate}\n🧼 Service : €${child.serviceRate}`,
        { parse_mode: "Markdown", reply_markup: keyboard.reply_markup }
      );
    }

    // Если пин неверный — увеличиваем счетчик
    userData.failedAttempts++;
    if (userData.failedAttempts >= MAX_ATTEMPTS) {
      userData.blockedUntil = now + BLOCK_TIME_MS;
      await ctx.reply(`🚫 Trop de tentatives échouées. Blocage pendant ${BLOCK_TIME_MS / 60000} minutes.`);
    } else {
      await ctx.reply(`❌ PIN incorrect. Tentative ${userData.failedAttempts} sur ${MAX_ATTEMPTS}.`);
    }
    attemptsMap.set(telegramId, userData);

    return; // завершаем здесь
  }

    if (await addChildHandler.isAdding(telegramId)) {
      return addChildHandler.processInputStart(ctx);
    } else if (await editPriceHandler.isEditing(telegramId)) {
      return editPriceHandler.processInput(ctx);
    } else {
      return ctx.reply("❓ Commande ou action inconnue. Utilisez le menu.");
    }
  });

  bot.action("logout", rateLimitForPin(10000), async (ctx) => {
    await ctx.answerCbQuery();
    const telegramId = ctx.from.id;
    await sessionService.deleteSession(telegramId);
    await ctx.answerCbQuery("Vous avez été déconnecté.");
    await ctx.reply(
      "👋 Vous êtes bien déconnecté. Pour vous reconnecter, veuillez saisir votre code PIN."
    );
  });
};
