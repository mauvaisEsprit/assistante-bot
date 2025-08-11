const userLastRequests = new Map();


const RATE_LIMIT_MS = 10000;

module.exports = () => {
    return async (ctx, next) => {
        console.log("555")
        const userId = ctx.from?.id;
        
        

        const now = Date.now();
        const lastTime = userLastRequests.get(userId) || 0;

        if (now - lastTime < RATE_LIMIT_MS) {
            return;
        }

        userLastRequests.set(userId, now);
        await next();
        };
    };