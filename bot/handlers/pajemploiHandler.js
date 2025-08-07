const moment = require("moment");
const Visit = require("../models/Visit");
const Child = require("../models/Child");
const pajemploiMonthKeyboard = require("../keyboards/pajemploiMonthKeyboard");
const generatePajemploiPdf = require("../utils/pdfUtils").generatePajemploiPdf;
const { Markup } = require("telegraf");

module.exports = {
  selectMonth: async (ctx) => {
  
    const [, childId] = ctx.match;
    const months = await Visit.find({ childId }).distinct("date");

    const uniqueMonths = [
      ...new Set(months.map((date) => moment(date).format("YYYY-MM"))),
    ]
      .sort()
      .reverse();

    if (uniqueMonths.length === 0) {
      return ctx.reply("Aucune donnée disponible.");
    }

    return ctx.reply("🧾 Choisissez un mois :", {
      reply_markup: pajemploiMonthKeyboard(childId, uniqueMonths),
    });
  },

  generatePdf: async (ctx) => {
 
    const [, childId, monthStr] = ctx.match;
    const start = moment(monthStr, "YYYY-MM").startOf("month");
    const end = moment(start).endOf("month");

    const startStr = start.format("YYYY-MM-DD");
    const endStr = end.format("YYYY-MM-DD");

    const visits = await Visit.find({
      childId,
      date: { $gte: startStr, $lte: endStr },
    }).lean();

    const child = await Child.findById(childId).lean();

    if (!visits.length) {
      return ctx.reply("Aucune visite pour ce mois.");
    }

    const buffer = await generatePajemploiPdf(child, visits, monthStr);
    await ctx.replyWithDocument({
      source: buffer,
      filename: `pajemploi_${child.name}_${monthStr}.pdf`,
    });
    await ctx.answerCbQuery("PDF généré avec succès !");
    // Кнопка "Retour" вместо "Назад"
    const buttons = [
      
      [{ text: '🔙 Retour à l\'enfant', callback_data: `child_menu_${childId}` }]
    ];

    return ctx.reply("Que souhaitez-vous faire ensuite ?", Markup.inlineKeyboard(buttons));
  },
};
