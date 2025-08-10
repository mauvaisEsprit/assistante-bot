// utils/checkUtils.js
const Visit = require('../models/Visit');
const moment = require('moment-timezone');


async function checkIn(childId) {
  const now = moment().tz('Europe/Paris');
  const date = now.format('YYYY-MM-DD');
  const startTime = roundToNearest15Down(now);

  const openVisit = await Visit.findOne({ childId, date, endTime: { $exists: false } });
  if (openVisit) return { error: 'Visit est deja ouverte' };

  const visit = new Visit({ childId, date, startTime });
  await visit.save();

  return { visit };
}

async function checkOut(childId) {
  const now = moment().tz('Europe/Paris');
  const date = now.format('YYYY-MM-DD');
  const endTime = roundToNearest15Up(now); // Округляем вверх

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

// Округление вниз
function roundToNearest15Down(momentObj) {
  let minutes = momentObj.minutes();
  minutes = Math.floor(minutes / 15) * 15;
  return momentObj.minutes(minutes).seconds(0).format('HH:mm');
}

// Округление вверх
function roundToNearest15Up(momentObj) {
  let minutes = momentObj.minutes();
  minutes = Math.ceil(minutes / 15) * 15;
  if (minutes === 60) {
    momentObj.add(1, 'hour');
    minutes = 0;
  }
  return momentObj.minutes(minutes).seconds(0).format('HH:mm');
}

module.exports = { checkIn, checkOut, setLunch };
