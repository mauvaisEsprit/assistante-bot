const { Markup } = require('telegraf');

module.exports = (childId) =>
  Markup.inlineKeyboard([
    [{ text: '✏️ Modifier le nom', callback_data: `edit_price_name_${childId}` }],
    [{ text: '✏️ Modifier le tarif horaire', callback_data: `edit_price_hourly_${childId}` }],
    [{ text: '✏️ Modifier le tarif repas', callback_data: `edit_price_meal_${childId}` }],
    [{ text: '✏️ Modifier le tarif de service', callback_data: `edit_price_service_${childId}` }],
    [{ text: '✏️ Modifier la limite d’heures par semaine', callback_data: `edit_price_overtimeThreshold_${childId}` }],
    [{ text: '✏️ Modifier le multiplicateur d’heures supplémentaires', callback_data: `edit_price_overtimeMultiplier_${childId}` }],
    [{ text: '❌ Annuler', callback_data: `cancel_edit_${childId}` }],
    [{ text: '🔙 Retour', callback_data: `child_menu_${childId}` }],
  ]).reply_markup;
