const Visit = require("../models/Visit");
const { Types } = require("mongoose");
const Session = require("../models/Session");
const Child = require("../models/Child");
const sessionService = require("../services/sessionService");
const moment = require("moment");
require("moment/locale/fr"); // подключаем французскую локаль
moment.locale("fr");

const {
  monthsKeyboard,
  datesKeyboard,
} = require("../keyboards/historyKeyboard");
const { calculateMonthSummary } = require("../services/visitStatsService");

// Функция для капитализации первой буквы строки
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
  async showMonths(ctx) {
    const childId = ctx.callbackQuery.data.split("_")[2];
    if (!Types.ObjectId.isValid(childId)) {
      return ctx.reply("ID de l'enfant invalide");
    }
    const childObjectId = new Types.ObjectId(childId);

    const visits = await Visit.find({ childId: childObjectId }).lean();

    if (!visits.length) {
      return ctx.answerCbQuery("Cet enfant n'a aucune visite", {
        show_alert: true,
      });
    }

    const uniqueMonths = [
      ...new Set(visits.map((v) => v.date.slice(0, 7))),
    ].sort((a, b) => b.localeCompare(a));
    const months = uniqueMonths.map((m) => moment(m, "YYYY-MM"));

    await ctx.reply("📅 Sélectionnez un mois pour voir l'historique :", {
      reply_markup: monthsKeyboard(childId, months).reply_markup,
    });
  },

  async showDates(ctx) {
    const [, , childId, yearMonth] = ctx.callbackQuery.data.split("_");
    if (!Types.ObjectId.isValid(childId)) {
      return ctx.reply("ID de l'enfant invalide");
    }
    const childObjectId = new Types.ObjectId(childId);

    const visits = await Visit.find({
      childId: childObjectId,
      date: { $regex: `^${yearMonth}` },
    }).lean();

    if (!visits.length) {
      return ctx.answerCbQuery("Pas de visites pour ce mois", {
        show_alert: true,
      });
    }

    const uniqueDates = [...new Set(visits.map((v) => v.date))].sort();
    const stats = await calculateMonthSummary(childId, yearMonth);

    // Формируем заголовок с капитализацией месяца
    const monthName = capitalizeFirstLetter(
      moment(yearMonth, "YYYY-MM").format("MMMM")
    );
    const year = moment(yearMonth, "YYYY-MM").format("YYYY");

    let statsText = `📅 ${monthName} ${year}\n`;
    statsText += `⏱ Heures totales : ${stats.totalHours.toFixed(2)}\n`;
    statsText += `   ├ Heures normales : ${stats.regularHours.toFixed(2)}\n`;
    statsText += `   └ Heures supplémentaires : ${stats.overtimeHours.toFixed(
      2
    )}\n\n`;
    statsText += `💰 Paiement :\n`;
    statsText += `   ├ Heures normales : ${stats.regularPay.toFixed(2)}€\n`;
    statsText += `   ├ Heures supplémentaires : ${stats.overtimePay.toFixed(
      2
    )}€\n`;
    statsText += `   ├ Repas : ${stats.mealsPay.toFixed(2)}€ (${
      stats.mealsCount
    })\n`;
    statsText += `   ├ Service : ${stats.servicePay.toFixed(2)}€ (${
      stats.daysCount
    } jours)\n`;
    statsText += `   └ TOTAL : ${stats.totalPay.toFixed(2)}€\n\n`;
    statsText += `📌 Choisissez une date :`;

    await ctx.reply(statsText, {
      reply_markup: datesKeyboard(childId, yearMonth, uniqueDates).reply_markup,
    });
  },

  async showVisitsForDate(ctx) {
    const [, , childId, date] = ctx.callbackQuery.data.split("_");

    if (!Types.ObjectId.isValid(childId)) {
      return ctx.reply("ID de l'enfant invalide");
    }

    const childObjectId = new Types.ObjectId(childId);

    const visits = await Visit.find({ childId: childObjectId, date }).lean();

    if (!visits.length) {
      return ctx.answerCbQuery("Pas de visites à cette date", {
        show_alert: true,
      });
    }

    const child = await Child.findById(childId).lean();
    if (!child) {
      return ctx.answerCbQuery("Données de l'enfant introuvables", {
        show_alert: true,
      });
    }

    // Détermination du rôle
    const telegramId = ctx.from.id;
    const session = await sessionService.getSession(telegramId);

    if (!session || session.expiresAt < Date.now()) {
      return ctx.answerCbQuery("Veuillez vous reconnecter", {
        show_alert: true,
      });
    }

    const isAdmin = session.role === "admin";

    // Calculs
    const weekStart = moment(date).startOf("isoWeek").format("YYYY-MM-DD");
    const visitsBeforeToday = await Visit.find({
      childId,
      date: { $gte: weekStart, $lt: date },
    }).lean();

    let hoursBeforeDay = visitsBeforeToday.reduce((sum, v) => {
      const start = moment(v.startTime, "HH:mm");
      const end = moment(v.endTime, "HH:mm");
      return sum + moment.duration(end.diff(start)).asHours();
    }, 0);

    let totalHours = 0,
      regularHours = 0,
      overtimeHours = 0,
      mealCount = 0;

    for (const v of visits) {
      if (!v.startTime || !v.endTime) continue; // ⬅️ защита от undefined

      const start = moment(v.startTime, "HH:mm");
      const end = moment(v.endTime, "HH:mm");
      const duration = moment.duration(end.diff(start)).asHours();

      const regularAvailable = Math.max(
        0,
        child.overtimeThreshold - hoursBeforeDay
      );
      const regH = Math.min(duration, regularAvailable);
      const overH = duration - regH;

      regularHours += regH;
      overtimeHours += overH;
      hoursBeforeDay += duration;
      totalHours += duration;

      if (v.hadLunch) mealCount++;
    }

    const regularPay = regularHours * child.hourlyRate;
    const overtimePay =
      overtimeHours * child.hourlyRate * child.overtimeMultiplier;
    const mealPay = mealCount * child.mealRate;
    const servicePay = visits.length > 0 ? child.serviceRate : 0;
    const totalPay = regularPay + overtimePay + mealPay + servicePay;

    // Формируем дату с капитализацией месяца
    const day = moment(date).format("D");
    const monthName = capitalizeFirstLetter(moment(date).format("MMMM"));
    const year = moment(date).format("YYYY");

    let text = `📅 ${day} ${monthName} ${year}\n`;
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
    visits.forEach((v) => {
      const endTimeDisplay = v.endTime ? v.endTime : "en cours";
      text += `• ${v.startTime} - ${endTimeDisplay}${v.hadLunch ? " 🍽" : ""}\n`;
      if (isAdmin) {
        buttons.push([
          {
            text: `🗑 Supprimer ${v.startTime}-${endTimeDisplay}`,
            callback_data: `delv_${v._id}`,
          },
        ]);
      }
    });

    const yearMonth = date.slice(0, 7);
    buttons.push([
      {
        text: "⬅ Retour",
        callback_data: `history_dates_${childId}_${yearMonth}`,
      },
    ]);

    await ctx.reply(text, { reply_markup: { inline_keyboard: buttons } });
  },
};
