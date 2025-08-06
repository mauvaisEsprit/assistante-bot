const Visit = require('../models/Visit');
const Child = require('../models/Child');
const moment = require('moment');

function emptySummary() {
  return {
    totalHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    mealsCount: 0,
    daysCount: 0,
    totalPay: 0,
    regularPay: 0,
    overtimePay: 0,
    mealsPay: 0,
    servicePay: 0
  };
}

async function calculateMonthSummary(childId, yearMonth) {
  const child = await Child.findById(childId).lean();
  if (!child) return null;

  const visits = await Visit.find({
    childId,
    date: { $regex: `^${yearMonth}` }
  }).sort({ date: 1, startTime: 1 }).lean();

  if (!visits.length) return emptySummary();

  let totalHours = 0, regularHours = 0, overtimeHours = 0;
  let mealsCount = 0, daysCount = 0;
  let weeklyHours = {};
  let lastDay = null;

  for (const v of visits) {
    const week = moment(v.date).isoWeek();
    if (!weeklyHours[week]) weeklyHours[week] = 0;

    const hours = moment.duration(
      moment(v.endTime, 'HH:mm').diff(moment(v.startTime, 'HH:mm'))
    ).asHours();

    const availableRegular = Math.max(0, child.overtimeThreshold - weeklyHours[week]);
    const regH = Math.min(hours, availableRegular);
    const overH = hours - regH;

    regularHours += regH;
    overtimeHours += overH;
    totalHours += hours;

    weeklyHours[week] += hours;

    if (v.hadLunch) mealsCount++;
    if (lastDay !== v.date) {
      daysCount++;
      lastDay = v.date;
    }
  }

  const regularPay = regularHours * child.hourlyRate;
  const overtimePay = overtimeHours * child.hourlyRate * child.overtimeMultiplier;
  const mealsPay = mealsCount * child.mealRate;
  const servicePay = daysCount * child.serviceRate;
  const totalPay = regularPay + overtimePay + mealsPay + servicePay;

  return { totalHours, regularHours, overtimeHours, mealsCount, daysCount, totalPay, regularPay, overtimePay, mealsPay, servicePay };
}

async function calculateDaySummary(childId, date) {
  const child = await Child.findById(childId).lean();
  if (!child) return null;

  const weekStart = moment(date).startOf("isoWeek").format("YYYY-MM-DD");
  const weekEnd = moment(date).endOf("isoWeek").format("YYYY-MM-DD");

  const visits = await Visit.find({
    childId,
    date: { $gte: weekStart, $lte: weekEnd }
  }).sort({ date: 1, startTime: 1 }).lean();

  if (!visits.length) {
    return {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      mealsCount: 0,
      totalPay: 0,
      regularPay: 0,
      overtimePay: 0,
      mealsPay: 0,
      servicePay: 0
    };
  }

  let weeklyHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  let mealsCount = 0;
  const countedDays = new Set();

  for (const v of visits) {
    const start = moment(v.startTime, 'HH:mm');
    const end = moment(v.endTime, 'HH:mm');

    const hours = moment.duration(end.diff(start)).asHours();

    if (moment(v.date).isAfter(date)) {
      // Визит после текущего дня — пропускаем
      continue;
    }

    const availableRegular = Math.max(0, child.overtimeThreshold - weeklyHours);
    const regH = Math.min(hours, availableRegular);
    const overH = hours - regH;

    if (v.date === date) {
      regularHours += regH;
      overtimeHours += overH;

      if (v.hadLunch) mealsCount++;
      countedDays.add(v.date);
    }

    weeklyHours += hours;

    console.log(`Дата: ${v.date}, Часы: ${hours.toFixed(2)}, Регулярные: ${regH.toFixed(2)}, Сверхурочные: ${overH.toFixed(2)}, Накопленные часы недели: ${weeklyHours.toFixed(2)}`);
  }

  const totalHours = regularHours + overtimeHours;

  const regularPay = regularHours * child.hourlyRate;
  const overtimePay = overtimeHours * child.hourlyRate * child.overtimeMultiplier;
  const mealsPay = mealsCount * child.mealRate;
  const servicePay = countedDays.size * child.serviceRate;
  const totalPay = regularPay + overtimePay + mealsPay + servicePay;

  console.log(`Итог по дню ${date} — всего часов: ${totalHours.toFixed(2)}, обычных: ${regularHours.toFixed(2)}, сверхурочных: ${overtimeHours.toFixed(2)}`);

  return { totalHours, regularHours, overtimeHours, mealsCount, daysCount: countedDays.size, totalPay, regularPay, overtimePay, mealsPay, servicePay };
}



module.exports = { calculateMonthSummary, calculateDaySummary };
