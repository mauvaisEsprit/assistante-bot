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
      // Сохраняем имя и меняем шаг на ввод PIN
      session.name = name;
      session.step = 'awaiting_pin';
      addChildSessions.set(ctx.from.id, session);

      return ctx.reply(
        '🔑 Maintenant, veuillez entrer un code PIN (4 à 6 chiffres) :',
        Markup.inlineKeyboard([
          [Markup.button.callback('❌ Annuler', 'cancel_add_child')]
        ])
      );
    }

    if (session.step === 'awaiting_pin') {
      const pin = ctx.message.text.trim();

      if (!/^\d{4,6}$/.test(pin)) {
        return ctx.reply('⚠️ Le PIN doit contenir entre 4 et 6 chiffres. Veuillez réessayer :');
      }

      // Проверяем, что такой PIN ещё не используется
      const existingChild = await Child.findOne({ pinCode: pin }).lean();
      if (existingChild) {
        return ctx.reply('⚠️ Ce code PIN est déjà utilisé. Veuillez en choisir un autre :');
      }

      // Создаём ребёнка с именем и PIN
      const child = new Child({
        name: session.name,
        pinCode: pin,
        hourlyRate: 0,
        mealRate: 0,
        serviceRate: 0,
        overtimeThreshold: 45,
        overtimeMultiplier: 1.25,
      });

      await child.save();

      addChildSessions.delete(ctx.from.id);

      await ctx.reply(`✅ L'enfant "${session.name}" a été ajouté avec succès avec le PIN !`);
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
