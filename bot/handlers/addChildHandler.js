const Child = require('../models/Child');
const sessionService = require('../services/sessionService'); // вот здесь подключаем твой сервис
const { Markup } = require('telegraf');

module.exports = {
  async isAdding(telegramId) {
    const session = await sessionService.getSession(telegramId);
    return session?.addChildStep != null;
  },

  async startAddChild(ctx) {
    await sessionService.updateSession(
      ctx.from.id,
      { addChildStep: 'awaiting_name' }
    );

    await ctx.reply(
      '📝 Entrez le nom du nouvel enfant :',
      Markup.inlineKeyboard([
        [Markup.button.callback('❌ Annuler', 'cancel_add_child')]
      ])
    );
  },

  async processInputStart(ctx) {
    if (!ctx.message || !ctx.message.text) return;

    const telegramId = ctx.from.id;
    const session = await sessionService.getSession(telegramId);
    if (!session?.addChildStep) return;

    if (session.addChildStep === 'awaiting_name') {
      const name = ctx.message.text.trim();
      if (!name) {
        return ctx.reply('⚠️ Le nom ne peut pas être vide. Veuillez réessayer :');
      }

      await sessionService.updateSession(
        ctx.from.id,
        { addChildStep: 'awaiting_pin', tempChildName: name }
      );

      return ctx.reply(
        '🔑 Maintenant, veuillez entrer un code PIN (4 à 6 chiffres) :',
        Markup.inlineKeyboard([
          [Markup.button.callback('❌ Annuler', 'cancel_add_child')]
        ])
      );
    }

    if (session.addChildStep === 'awaiting_pin') {
      const pin = ctx.message.text.trim();

      if (!/^\d{4,6}$/.test(pin)) {
        return ctx.reply('⚠️ Le PIN doit contenir entre 4 et 6 chiffres. Veuillez réessayer :');
      }

      const existingChild = await Child.findOne({ pinCode: pin }).lean();
      if (existingChild) {
        return ctx.reply('⚠️ Ce code PIN est déjà utilisé. Veuillez en choisir un autre :');
      }

      const child = new Child({
        name: session.tempChildName,
        pinCode: pin,
        hourlyRate: 0,
        mealRate: 0,
        serviceRate: 0,
        overtimeThreshold: 46,
        overtimeMultiplier: 1.25,
      });

      await child.save();

      await sessionService.updateSession(
        ctx.from.id,
        { $unset: { addChildStep: "", tempChildName: "" } }
      );

      await ctx.reply(`✅ L'enfant "${session.tempChildName}" a été ajouté avec succès avec le PIN !`);
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
    await sessionService.updateSession(
      ctx.from.id,
      { $unset: { addChildStep: "", tempChildName: "" } }
    );

    await ctx.reply('❌ Ajout de l’enfant annulé.');
    await ctx.reply(
      'Vous pouvez revenir au menu des paramètres.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Retour', 'open_settings')]
      ])
    );
  }
};
