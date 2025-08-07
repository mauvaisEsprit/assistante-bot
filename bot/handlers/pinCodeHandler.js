const Child = require('../models/Child');
require('dotenv').config();
const startHandler = require('../handlers/startHandler');
const { Markup } = require('telegraf');
const authorizedUsers = require('../utils/authStore');
const addChildHandler = require('../handlers/addChildHandler');
const editPriceHandler = require('../handlers/editPriceHandler');

// Хранилище сообщений userId -> [{chatId, messageId}]
const userMessages = new Map();

async function saveMessage(ctx, sentMessage) {
  const userId = ctx.from.id;
  if (!userMessages.has(userId)) {
    userMessages.set(userId, []);
  }
  userMessages.get(userId).push({ chatId: sentMessage.chat.id, messageId: sentMessage.message_id });
}

module.exports = (bot) => {
  bot.start(async (ctx) => {
    if (authorizedUsers.has(ctx.from.id)) {
      const auth = authorizedUsers.get(ctx.from.id);
      if (auth.role === 'admin') {
        const msg1 = await ctx.reply('👋 Vous êtes connecté en tant qu\'administrateur. Accès à tous les enfants.');
        await saveMessage(ctx, msg1);
        await startHandler(ctx);
        return;
      } else {
        const child = await Child.findById(auth.childId).lean();
        if (!child) {
          const msg = await ctx.reply('❌ Enfant introuvable.');
          await saveMessage(ctx, msg);
          return;
        }

        const msg = await ctx.reply(`👶 Informations sur l'enfant : ${child.name}`);
        await saveMessage(ctx, msg);
        return;
      }
    }
    const msg = await ctx.reply('🔐 Veuillez entrer le code PIN pour accéder :');
    await saveMessage(ctx, msg);
  });

  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;

    // Если пользователь НЕ авторизован — ждем PIN
    if (!authorizedUsers.has(userId)) {
      const pin = ctx.message.text.trim();

      if (pin === process.env.ADMIN_PIN) {
        authorizedUsers.set(userId, { role: 'admin' });
        await ctx.reply('✅ Vous êtes connecté en tant qu\'administrateur. Accès à tous les enfants.');
        await startHandler(ctx);
        return;
      }

      const child = await Child.findOne({ pinCode: pin }).lean();
      if (!child) {
        return ctx.reply('❌ PIN incorrect. Veuillez réessayer :');
      }

      authorizedUsers.set(userId, { role: 'child', childId: child._id });
      await ctx.reply(
        `✅ Connexion réussie ! Informations sur l'enfant :\n\n` +
        `👶 Nom : ${child.name}\n` +
        `💶 Tarif horaire : €${child.hourlyRate}\n` +
        `🍽️ Prix du repas : €${child.mealRate}\n` +
        `🧼 Prix des services : €${child.serviceRate}`,
        Markup.inlineKeyboard([
          [Markup.button.callback('📅 Historique des visites', `history_months_${child._id}`)],
          [Markup.button.callback('🔙 Se déconnecter', 'logout')],
        ])
      );
      return;
    }

    // Если авторизован — смотрим, в каком режиме пользователь:
    if (addChildHandler.isAdding(userId)) {
      await addChildHandler.processInputStart(ctx);
    } else if (editPriceHandler.isEditing(userId)) {
      await editPriceHandler.processInput(ctx);
    } else {
      // Другие случаи: либо игнорировать, либо выводить меню, либо сообщение
      // Например:
      await ctx.reply('❓ Commande ou action inconnue. Utilisez le menu.');
    }
  });

  bot.action('logout', async (ctx) => {
    authorizedUsers.delete(ctx.from.id);

    const msgs = userMessages.get(ctx.from.id) || [];
    for (const { chatId, messageId } of msgs) {
      try {
        await ctx.telegram.deleteMessage(chatId, messageId);
      } catch (e) {
        // игнорируем ошибки
      }
    }
    userMessages.delete(ctx.from.id);

    await ctx.answerCbQuery('Vous êtes déconnecté');

    // Красивое приветственное сообщение с кнопкой "Войти снова"
    const text = `👋 Vous vous êtes déconnecté avec succès.\n\n` +
                 `Pour vous reconnecter, cliquez sur le bouton ci-dessous et saisissez votre code PIN.`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔐 Se reconnecter', 'start_login')]
    ]);

    const msg = await ctx.reply(text, keyboard);
    await saveMessage(ctx, msg);
  });
};
