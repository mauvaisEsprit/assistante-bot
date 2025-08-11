const attemptsMap = new Map();


function pinRateLimiter(ctx, next) {
  const telegramId = ctx.from.id;
  const now = Date.now();

  let userData = attemptsMap.get(telegramId) || { failedAttempts: 0, blockedUntil: 0 };

  if (userData.blockedUntil > now) {
    const waitMs = userData.blockedUntil - now;
    const waitMin = Math.ceil(waitMs / 60000);
    return ctx.reply(`⏳ Tentatives bloquées. Réessayez dans ${waitMin} minute(s).`);
  }

  ctx.attemptsData = userData; // передаем данные для использования после проверки пина

  return next();
}

module.exports = pinRateLimiter;