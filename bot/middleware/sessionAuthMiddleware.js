// middleware проверки сессии (просто пример)
const Session = require("../models/Session");
const sessionService = require("../services/sessionService");

async function authMiddleware(ctx, next) {
  const telegramId = ctx.from.id;
  const session = await sessionService.getSession(telegramId);


  if (!session) {
    await ctx.answerCbQuery("❌ Vous n'êtes pas connecté. Veuillez vous connecter.");
    return; // не вызываем следующий обработчик
  }

  // Можно дополнительно проверить роль, если надо
  if (!["admin", "parent"].includes(session.role)) {
    await ctx.answerCbQuery("❌ Accès refusé.");
    return;
  }

  // Всё ок — продолжаем к следующему обработчику
  return next();
}

module.exports = authMiddleware;