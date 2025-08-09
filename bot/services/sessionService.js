// services/sessionService.js
const Session = require("../models/Session");

const cache = new Map(); // key: telegramId, value: session object

module.exports = {
  /**
   * Получить сессию из кэша или БД
   */
  async getSession(telegramId) {
    if (cache.has(telegramId)) {
      return cache.get(telegramId);
    }
    const session = await Session.findOne({ telegramId }).lean();
    if (session) cache.set(telegramId, session);
    return session;
  },

  /**
   * Обновить или создать сессию (поддерживает все mongo-операторы)
   * @param {Number|String} telegramId
   * @param {Object} update — любые mongo-операторы ($set, $unset, $inc, и т.п.)
   * @param {Object} opts — опции findOneAndUpdate
   */
  async updateSession(telegramId, update, opts = {}) {
    const defaultOpts = { upsert: true, new: true, lean: true };
    const session = await Session.findOneAndUpdate(
      { telegramId },
      update,
      { ...defaultOpts, ...opts }
    ).lean();
    cache.set(telegramId, session);
    return session;
  },

  /**
   * Удалить сессию
   */
  async deleteSession(telegramId) {
    await Session.deleteOne({ telegramId });
    cache.delete(telegramId);
  },

  /**
   * Полностью очистить кэш (например, при рестарте бота)
   */
  clearCache() {
    cache.clear();
  }
};
