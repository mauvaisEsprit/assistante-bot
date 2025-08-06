const Child = require('../models/Child');
const { Markup } = require('telegraf');

const addChildSessions = new Map();

module.exports = {
  isAdding(userId) {
    return addChildSessions.has(userId);
  },
  async startAddChild(ctx) {
    addChildSessions.set(ctx.from.id, { step: 'awaiting_name' });
    await ctx.reply(
      '📝 Entrez le nom du nouvel enfant :',
      Markup.inlineKeyboard([
        [Markup.button.callback('❌ Annuler', 'cancel_add_child')]
      ])
    );
  },

  async processInputStart(ctx) {
    if (!ctx.message || !ctx.message.text) return;

    const session = addChildSessions.get(ctx.from.id);
    if (!session) return;

    if (session.step === 'awaiting_name') {
      const name = ctx.message.text.trim();
      if (!name) {
        return ctx.reply('⚠️ Le nom ne peut pas être vide. Veuillez réessayer :');
      }

      const child = new Child({
        name,
        hourlyRate: 0,
        mealRate: 0,
        serviceRate: 0,
        overtimeThreshold: 45,
        overtimeMultiplier: 1.25,
      });

      await child.save();
      addChildSessions.delete(ctx.from.id);

      await ctx.reply(`✅ L'enfant "${name}" a été ajouté avec succès !`);
      await ctx.reply(
        'Vous pouvez modifier les informations de l’enfant :',
        Markup.inlineKeyboard([
          [Markup.button.callback('✏️ Modifier', `edit_prices_${child._id}`)],
          [Markup.button.callback('🔙 Retour', 'open_settings')]
        ])
      );
    }
  },

  async cancelAddChild(ctx) {
    addChildSessions.delete(ctx.from.id);
    await ctx.reply('❌ Ajout de l’enfant annulé.');
    await ctx.reply(
      'Vous pouvez revenir au menu des paramètres.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Retour', 'open_settings')]
      ])
    );
  }
};
