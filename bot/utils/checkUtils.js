// utils/checkUtils.js
const Visit = require('../models/Visit');
const moment = require('moment');

async function checkIn(childId) {
  const now = moment();
  const date = now.format('YYYY-MM-DD');
  const startTime = roundToNearest15(now);

  // Проверяем, нет ли уже открытого визита на сегодня
  const openVisit = await Visit.findOne({ childId, date, endTime: { $exists: false } });
  if (openVisit) return { error: 'Visit est deja ouverte' };

  const visit = new Visit({ childId, date, startTime });
  await visit.save();

  return { visit };
}

async function checkOut(childId) {
  const now = moment();
  const date = now.format('YYYY-MM-DD');
  const endTime = roundToNearest15(now);

  // Находим открытый визит
  const visit = await Visit.findOne({ childId, date, endTime: { $exists: false } });
  if (!visit) return { error: 'Нет открытого визита на сегодня' };

  visit.endTime = endTime;
  await visit.save();

  return { visit };
}

async function setLunch(visitId, hadLunch) {
  const visit = await Visit.findByIdAndUpdate(visitId, { hadLunch }, { new: true });
  return visit;
}

// Округляем время к ближайшему 15 минутному интервалу
function roundToNearest15(momentObj) {
  let minutes = momentObj.minutes();

  // Получаем номер 15-минутного интервала (0..3)
  const interval = Math.floor(minutes / 15);
  const startOfInterval = interval * 15;
  const offset = minutes - startOfInterval;

  // Если offset в [0..2] или [12..14], округляем вниз к startOfInterval
  if ((offset >= 0 && offset <= 2) || (offset >= 12 && offset <= 14)) {
    minutes = startOfInterval;
  } else {
    // Иначе округляем к ближайшему 15-минутному интервалу
    minutes = Math.round(minutes / 15) * 15;
  }

  // Если получилось 60 минут, переносим на следующий час
  if (minutes === 60) {
    momentObj.add(1, 'hour');
    minutes = 0;
  }

  return momentObj.minutes(minutes).seconds(0).format('HH:mm');
}


module.exports = { checkIn, checkOut, setLunch };
