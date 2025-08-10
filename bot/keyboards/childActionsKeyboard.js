// keyboards/childActionsKeyboard.js
const { Markup } = require('telegraf');
const Visit = require('../models/Visit');
const moment = require('moment');

module.exports = async function getChildActionsKeyboard(childId, role) {
  const today = moment().format('YYYY-MM-DD');
  const openVisit = await Visit.findOne({ childId, date: today, endTime: { $exists: false } });

  const checkInOutButton = openVisit
    ? { text: '✅ Check-out', callback_data: `checkout_${childId}` }
    : { text: '🟢 Check-in', callback_data: `checkin_${childId}` };

  if (role === 'admin') {
    return Markup.inlineKeyboard([
      [checkInOutButton],
      [{ text: '📅 Ajouter des heures', callback_data: `add_hours_${childId}` }],
      [{ text: '📜 Historique', callback_data: `history_months_${childId}` }],
      [{ text: '✏️ Modifier', callback_data: `edit_prices_${childId}` }],
      [{ text: '📄 Générer PDF Pajemploi', callback_data: `pajemploi_${childId}` }],
      [{ text: '🔙 Retour', callback_data: 'select_child' }],
    ]);
  } else {
    return Markup.inlineKeyboard([
      [{ text: '📜 Historique', callback_data: `history_months_${childId}` }],
      [{ text: '📄 Générer PDF Pajemploi', callback_data: `pajemploi_${childId}` }],
      [{ text: '🔙 Déconnexion', callback_data: 'logout' }],
    ]);
  }
};
