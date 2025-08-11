// middleware/rateLimitForPin.js
const rateLimitMap = new Map(); // key: userId, value: timestamp последнего запроса

function rateLimitForPin(timeoutMs) {
  return (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const lastTime = rateLimitMap.get(userId) || 0;
    const now = Date.now();

    if (now - lastTime < timeoutMs) {
      return ctx.reply('⏳ Attendez un peu avant de saisir votre code PIN.');
    }

    rateLimitMap.set(userId, now);
    return next();
  };
}

module.exports = rateLimitForPin;