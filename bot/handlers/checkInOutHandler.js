// handlers/checkInOutHandler.js
const { checkIn, checkOut, setLunch } = require('../utils/checkUtils');
const Visit = require('../models/Visit');

async function handleCheckIn(ctx) {
  const childId = ctx.match[1];

  const res = await checkIn(childId);
  if (res.error) {
    return ctx.answerCbQuery(res.error, { show_alert: true });
  }

  // Met à jour le clavier avec les boutons
  const getChildActionsKeyboard = require('../keyboards/childActionsKeyboard');
  const sessionService = require('../services/sessionService');
  const session = await sessionService.getSession(ctx.from.id);
  const keyboard = await getChildActionsKeyboard(childId, session.role);

  await ctx.editMessageReplyMarkup(keyboard.reply_markup);
  await ctx.answerCbQuery('Check-in enregistré avec succès');
}

async function handleCheckOut(ctx) {
  const childId = ctx.match[1];
  const res = await checkOut(childId);
  if (res.error) {
    return ctx.answerCbQuery(res.error, { show_alert: true });
  }

  // Sauvegarder l’ID de la visite dans la base pour pouvoir enregistrer le déjeuner plus tard
  // On écrit directement dans la BD (on mettra à jour Visit avec hadLunch via callback)
  ctx.session = ctx.session || {};
  ctx.session.lastVisitId = res.visit._id.toString();

  await ctx.editMessageReplyMarkup(); // enlever le clavier (optionnel)
  await ctx.reply(
    '✅ Check-out enregistré. L’enfant a-t-il déjeuné ?',
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Oui', callback_data: 'lunchyes' },
            { text: '❌ Non', callback_data: 'lunchno' }
          ]
        ]
      }
    }
  );
}

async function handleLunchAnswer(ctx) {
  const childId = ctx.match[1];
  const answer = ctx.callbackQuery.data;
  const hadLunch = answer === 'lunchyes';

  if (!ctx.session || !ctx.session.lastVisitId) {
    await ctx.answerCbQuery('Erreur : données de visite introuvables.', { show_alert: true });
    return;
  }

  await setLunch(ctx.session.lastVisitId, hadLunch);

  delete ctx.session.lastVisitId;

  await ctx.answerCbQuery();
  await ctx.reply(
    `✅ Information sur le repas enregistrée : ${hadLunch ? 'Oui' : 'Non'}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅ Retour aux enfants", callback_data: "select_child" }]
        ]
      }
    }
  );
}

module.exports = { handleCheckIn, handleCheckOut, handleLunchAnswer };
