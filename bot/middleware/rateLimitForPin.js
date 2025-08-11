const rateLimitForPin = (timeoutMs) => {
  // В памяти храним время последнего ввода пина на пользователя
  const lastAttemptMap = new Map();

  return async (ctx, next) => {
    const userId = ctx.from.id;
    const now = Date.now();

    if (lastAttemptMap.has(userId)) {
      const lastTime = lastAttemptMap.get(userId);
      const diff = now - lastTime;
      if (diff < timeoutMs) {
        // Если прошло меньше timeoutMs, блокируем
        return ctx.reply(`⏳ Merci d'attendre encore ${Math.ceil((timeoutMs - diff)/1000)} secondes avant de réessayer.`);
      }
    }

    // Регистрируем время попытки (независимо от результата проверки PIN)
    lastAttemptMap.set(userId, now);

    await next(); // пропускаем дальше к обработке PIN
  };
};

module.exports = rateLimitForPin;