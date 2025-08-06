const Child = require('../models/Child');
const getChildEditPricesKeyboard = require('../keyboards/childEditPricesKeyboard.js');
const getChildActionsKeyboard = require('../keyboards/childActionsKeyboard');

const editingSessions = new Map();

module.exports = {
  async startEditing(ctx) {
  const match = ctx.callbackQuery.data.match(/edit_price_(hourly|meal|service|overtimeThreshold|overtimeMultiplier|name)_(.+)/);
  if (!match) return;

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


  editingSessions.set(ctx.from.id, { childId, field });

  await ctx.answerCbQuery();

  if (field === 'name') {
    await ctx.reply(`Veuillez entrer le nouveau nom pour l'enfant :`);
  } else {
    await ctx.reply(`Veuillez entrer la nouvelle valeur pour ${fieldLabels[field]} :`);
  }
},


  async cancelEditing(ctx) {
    const userId = ctx.from.id;
    const session = editingSessions.get(userId);
    if (!session) {
      await ctx.answerCbQuery("Aucune édition en cours.");
      return;
    }

    const { childId } = session;
    editingSessions.delete(userId);

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
        reply_markup: getChildActionsKeyboard(child._id).reply_markup,
      }
    );
  },

 async processInput(ctx) {
  const session = editingSessions.get(ctx.from.id);
  if (!session) return;

  const { childId, field } = session;
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
    editingSessions.delete(ctx.from.id);

    const child = await Child.findById(childId).lean();
    if (child) {
      await ctx.editMessageText(
        `✅ Valeur mise à jour avec succès !\n\n👶 *${child.name}*\n💶 €${child.hourlyRate} / heure\n🍽️ €${child.mealRate} repas\n🧼 €${child.serviceRate} service\nLimite d’heures par semaine : ${child.overtimeThreshold}\nMultiplicateur heures supplémentaires : ${child.overtimeMultiplier}`,
        {
          parse_mode: "Markdown",
          reply_markup: getChildEditPricesKeyboard(child._id).reply_markup,
        }
      );
    } else {
      await ctx.answerCbQuery("❌ Enfant introuvable après mise à jour.", { show_alert: true });
    }

  } catch (e) {
    console.error(e);
    await ctx.reply("❌ Erreur lors de la mise à jour des données.");
  }
}


};
