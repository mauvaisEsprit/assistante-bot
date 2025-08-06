const startHandler = require('../handlers/startHandler');
const addChildHandler = require('../handlers/addChildHandler');
const Child = require('../models/Child');
const getSettingsKeyboard = require('../keyboards/settingsKeyboard');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    await startHandler(ctx);
  });

  bot.action('add_child', async (ctx) => {
    await addChildHandler.startAddChild(ctx);
  });

  // Обработка сообщений (text), если пользователь в режиме добавления ребёнка
  bot.on('text', async (ctx) => {
    await addChildHandler.processInput(ctx);
  });

  bot.action('cancel_add_child', async (ctx) => {
    await addChildHandler.cancelAddChild(ctx);
  });

  bot.action('open_settings', async (ctx) => {
    const settingsKeyboard = require('../keyboards/settingsKeyboard')();
    await ctx.editMessageText('⚙️ Paramètres :', { reply_markup: settingsKeyboard });
  });

  // Удаление ребёнка — список
  bot.action('delete_child', async (ctx) => {
    const children = await Child.find().lean();

    if (children.length === 0) {
      return ctx.answerCbQuery('Aucun enfant à supprimer', { show_alert: true });
    }

    const buttons = children.map(child => ([{
      text: child.name,
      callback_data: `delete_child_select_${child._id}`
    }]));

    buttons.push([{ text: '🔙 Retour', callback_data: 'open_settings' }]);

    await ctx.editMessageText('Sélectionnez un enfant à supprimer :', {
      reply_markup: { inline_keyboard: buttons }
    });
  });

  // Подтверждение удаления
  bot.action(/^delete_child_select_(.+)$/, async (ctx) => {
    const childId = ctx.match[1];

    const child = await Child.findById(childId).lean();
    if (!child) {
      return ctx.answerCbQuery("Enfant introuvable", { show_alert: true });
    }

    await ctx.editMessageText(
      `Voulez-vous vraiment supprimer l'enfant "${child.name}" ? Cette action est irréversible.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Oui, supprimer', callback_data: `delete_child_confirm_${childId}` },
              { text: '❌ Annuler', callback_data: 'delete_child' }
            ]
          ]
        }
      }
    );
  });

  // Исполнение удаления
  bot.action(/^delete_child_confirm_(.+)$/, async (ctx) => {
    const childId = ctx.match[1];

    try {
      await Child.findByIdAndDelete(childId);
      await ctx.answerCbQuery("Enfant supprimé");

      await ctx.editMessageText('Enfant supprimé. Menu des paramètres :', {
        reply_markup: getSettingsKeyboard()
      });

    } catch (e) {
      console.error(e);
      await ctx.answerCbQuery("Erreur lors de la suppression de l'enfant", { show_alert: true });
    }
  });
};
