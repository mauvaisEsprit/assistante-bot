const Child = require('../models/Child');
const getChildEditPricesKeyboard = require('../keyboards/childEditPricesKeyboard.js');
const sessionService = require('../services/sessionService');
const { Markup } = require('telegraf');

module.exports = {
  async isEditing(telegramId) {
    const session = await sessionService.getSession(telegramId);
    return session?.editPriceStep != null;
  },

  async startEditing(ctx) {
    const match = ctx.callbackQuery.data.match(/edit_price_(hourly|meal|service|overtimeThreshold|overtimeMultiplier|name)_(.+)/);
    if (!match) {
      return ctx.answerCbQuery('ID enfant invalide', { show_alert: true });
    }

    const field = match[1];
    const childId = match[2];

    const fieldLabels = {
      hourly: 'tarif horaire (€ / heure)',
      meal: 'prix du repas (€)',
      service: 'prix du service (€)',
      overtimeThreshold: 'limite d’heures par semaine',
      overtimeMultiplier: 'multiplicateur des heures supplémentaires',
      name: 'nom de l’enfant'
    };

    // Обновляем сессию через sessionService
    await sessionService.updateSession(ctx.from.id, {
      $set: {
        editPriceStep: 'awaiting_value',
        editPriceField: field,
        editPriceChildId: childId,
      }
    });

    await ctx.answerCbQuery();

    if (field === 'name') {
      await ctx.reply(`Veuillez entrer le nouveau nom pour l'enfant :`);
    } else {
      await ctx.reply(`Veuillez entrer la nouvelle valeur pour ${fieldLabels[field]} :`);
    }
  },

  async cancelEditing(ctx) {
    const telegramId = ctx.from.id;
    const session = await sessionService.getSession(telegramId);

    if (!session?.editPriceStep) {
      await ctx.answerCbQuery("Aucune édition en cours.");
      return;
    }

    const childId = session.editPriceChildId;

    await sessionService.updateSession(telegramId, {
      $unset: { editPriceStep: "", editPriceField: "", editPriceChildId: "" }
    });

    await ctx.answerCbQuery("Édition annulée.");

    const child = await Child.findById(childId).lean();
    if (!child) {
      return ctx.reply("❌ Enfant non trouvé.");
    }

    await ctx.reply("❌ Mode édition annulé.");
    await ctx.reply(
      `👶 *${child.name}*\n💶 €${child.hourlyRate} / heure\n🍽️ €${child.mealRate} repas\n🧼 €${child.serviceRate} service\nLimite d’heures par semaine : €${child.overtimeThreshold}\nMultiplicateur heures supplémentaires : €${child.overtimeMultiplier}`,
      {
        parse_mode: "Markdown",
        reply_markup: getChildEditPricesKeyboard(child._id).reply_markup,
      }
    );
  },

  async processInput(ctx) {
    const telegramId = ctx.from.id;
    const session = await sessionService.getSession(telegramId);

    if (!session?.editPriceStep) return;

    const { editPriceField: field, editPriceChildId: childId } = session;
    let update = {};

    if (field === 'name') {
      const newName = ctx.message.text.trim();
      if (!newName) {
        return ctx.reply("❌ Le nom ne peut pas être vide.");
      }
      update.name = newName;
    } else {
      const value = parseFloat(ctx.message.text.replace(',', '.'));
      if (isNaN(value) || value < 0) {
        return ctx.reply("❌ Veuillez saisir un nombre positif valide.");
      }

      if (field === 'hourly') update.hourlyRate = value;
      else if (field === 'meal') update.mealRate = value;
      else if (field === 'service') update.serviceRate = value;
      else if (field === 'overtimeThreshold') update.overtimeThreshold = value;
      else if (field === 'overtimeMultiplier') update.overtimeMultiplier = value;
    }

    try {
      await Child.findByIdAndUpdate(childId, update);

      // Убираем данные редактирования из сессии через sessionService
      await sessionService.updateSession(telegramId, {
        $unset: { editPriceStep: "", editPriceField: "", editPriceChildId: "" }
      });

      await ctx.reply("✅ Valeur mise à jour avec succès !");

      const child = await Child.findById(childId).lean();
      if (child) {
        await ctx.reply(
          `👶 *${child.name}*\n💶 €${child.hourlyRate} / heure\n🍽️ €${child.mealRate} repas\n🧼 €${child.serviceRate} service\nLimite d’heures par semaine : ${child.overtimeThreshold}\nMultiplicateur heures supplémentaires : ${child.overtimeMultiplier}`,
          {
            parse_mode: "Markdown",
            reply_markup: getChildEditPricesKeyboard(child._id),
          }
        );
      }
    } catch (e) {
      console.error(e);
      await ctx.reply("❌ Erreur lors de la mise à jour des données.");
    }
  }
};
