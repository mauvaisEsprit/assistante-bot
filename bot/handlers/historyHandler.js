const Visit = require("../models/Visit");
const Child = require("../models/Child");
const moment = require("moment");
const {
  monthsKeyboard,
  datesKeyboard,
  visitsBackKeyboard,
} = require("../keyboards/historyKeyboard");
const { calculateMonthSummary } = require("../services/visitStatsService");
const { calculateDaySummary } = require("../services/visitStatsService");

module.exports = {
  // Étape 1 — afficher les mois
  async showMonths(ctx) {
    const childId = ctx.callbackQuery.data.split("_")[2];

    // Trouver toutes les visites de cet enfant
    const visits = await Visit.find({ childId }).lean();

    if (!visits.length) {
      return ctx.answerCbQuery("Cet enfant n'a aucune visite", {
        show_alert: true,
      });
    }

    // Extraire les mois uniques des dates de visite
    const uniqueMonths = [
      ...new Set(
        visits.map((v) => v.date.slice(0, 7)) // format YYYY-MM
      ),
    ].sort((a, b) => b.localeCompare(a)); // tri du plus récent au plus ancien

    // Convertir en objets moment
    const months = uniqueMonths.map((m) => moment(m, "YYYY-MM"));

    await ctx.reply("📅 Sélectionnez un mois pour voir l'historique :", {
      reply_markup: monthsKeyboard(childId, months).reply_markup,
    });
  },

  // Étape 2 — afficher les dates
  async showDates(ctx) {
    const [, , childId, yearMonth] = ctx.callbackQuery.data.split("_");

    const visits = await Visit.find({
      childId,
      date: { $regex: `^${yearMonth}` },
    }).lean();

    if (!visits.length) {
      return ctx.answerCbQuery("Pas de visites pour ce mois", {
        show_alert: true,
      });
    }

    const uniqueDates = [...new Set(visits.map((v) => v.date))].sort();

    // Obtenir les statistiques
    const stats = await calculateMonthSummary(childId, yearMonth);

    let statsText = `📅 ${moment(yearMonth, "YYYY-MM").format("MMMM YYYY")}\n`;
    statsText += `⏱ Heures totales : ${stats.totalHours.toFixed(2)}\n`;
    statsText += `   ├ Heures normales : ${stats.regularHours.toFixed(2)}\n`;
    statsText += `   └ Heures supplémentaires : ${stats.overtimeHours.toFixed(2)}\n\n`;
    statsText += `💰 Paiement :\n`;
    statsText += `   ├ Heures normales : ${stats.regularPay.toFixed(2)}€\n`;
    statsText += `   ├ Heures supplémentaires : ${stats.overtimePay.toFixed(2)}€\n`;
    statsText += `   ├ Repas : ${stats.mealsPay.toFixed(2)}€ (${stats.mealsCount})\n`;
    statsText += `   ├ Service : ${stats.servicePay.toFixed(2)}€ (${stats.daysCount} jours)\n`;
    statsText += `   └ TOTAL : ${stats.totalPay.toFixed(2)}€\n\n`;
    statsText += `📌 Choisissez une date :`;

    await ctx.reply(statsText, {
      reply_markup: datesKeyboard(childId, yearMonth, uniqueDates).reply_markup,
    });
  },

  // Étape 3 — afficher les visites du jour sélectionné
  async showVisitsForDate(ctx) {
    const [, , childId, date] = ctx.callbackQuery.data.split('_');

    const visits = await Visit.find({ childId, date }).lean();
    if (!visits.length) {
      return ctx.answerCbQuery('Pas de visites à cette date', { show_alert: true });
    }

    const child = await Child.findById(childId).lean();
    if (!child) {
      return ctx.answerCbQuery('Données de l’enfant introuvables', { show_alert: true });
    }

    // Obtenir les visites de la semaine avant la date (excluant la date)
    const weekStart = moment(date).startOf('isoWeek').format('YYYY-MM-DD');
    const visitsBeforeToday = await Visit.find({
      childId,
      date: { $gte: weekStart, $lt: date }
    }).lean();

    // Somme des heures la semaine avant la date sélectionnée
    let hoursBeforeDay = visitsBeforeToday.reduce((sum, v) => {
      const start = moment(v.startTime, 'HH:mm');
      const end = moment(v.endTime, 'HH:mm');
      return sum + moment.duration(end.diff(start)).asHours();
    }, 0);

    let totalHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;
    let mealCount = 0;

    // Calcul des heures du jour avec seuil d'heures normales
    for (const v of visits) {
      const start = moment(v.startTime, 'HH:mm');
      const end = moment(v.endTime, 'HH:mm');
      const duration = moment.duration(end.diff(start)).asHours();

      const regularAvailable = Math.max(0, child.overtimeThreshold - hoursBeforeDay);
      const regH = Math.min(duration, regularAvailable);
      const overH = duration - regH;

      regularHours += regH;
      overtimeHours += overH;

      hoursBeforeDay += duration;
      totalHours += duration;

      if (v.hadLunch) mealCount++;
    }

    const regularPay = regularHours * child.hourlyRate;
    const overtimePay = overtimeHours * child.hourlyRate * child.overtimeMultiplier;
    const mealPay = mealCount * child.mealRate;
    const servicePay = visits.length > 0 ? child.serviceRate : 0;
    const totalPay = regularPay + overtimePay + mealPay + servicePay;

    let text = `📅 ${moment(date).format('D MMMM YYYY')}\n`;
    text += `⏱ Heures totales : ${totalHours.toFixed(2)}\n`;
    text += `   ├ Heures normales : ${regularHours.toFixed(2)}\n`;
    text += `   └ Heures supplémentaires : ${overtimeHours.toFixed(2)}\n\n`;
    text += `💰 Paiement :\n`;
    text += `   ├ Heures normales : ${regularPay.toFixed(2)}€\n`;
    text += `   ├ Heures supplémentaires : ${overtimePay.toFixed(2)}€\n`;
    text += `   ├ Repas : ${mealPay.toFixed(2)}€ (${mealCount})\n`;
    text += `   ├ Service : ${servicePay.toFixed(2)}€\n`;
    text += `   └ TOTAL : ${totalPay.toFixed(2)}€\n\n`;
    text += `📌 Enregistrements :\n`;

    const buttons = [];
    visits.forEach(v => {
      text += `• ${v.startTime} - ${v.endTime}${v.hadLunch ? ' 🍽' : ''}\n`;
      buttons.push([{ text: `🗑 Supprimer ${v.startTime}-${v.endTime}`, callback_data: `delv_${v._id}` }]);
    });

    const yearMonth = date.slice(0, 7);
    buttons.push([{ text: '⬅ Retour', callback_data: `history_dates_${childId}_${yearMonth}` }]);

    await ctx.reply(text, {
      reply_markup: { inline_keyboard: buttons }
    });
  }
}
