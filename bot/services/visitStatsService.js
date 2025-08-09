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
  if (!child) {
    console.warn(`Child not found: ${childId}`);
    return emptySummary();
  }

  const visits = await Visit.find({
    childId,
    date: { $regex: `^${yearMonth}` }
  }).sort({ date: 1, startTime: 1 }).lean();

  if (!visits.length) return emptySummary();

  const rate = child.hourlyRate || 0;
  const meal = child.mealRate || 0;
  const service = child.serviceRate || 0;
  const multi = child.overtimeMultiplier || 1;

  let totalHours = 0, regularHours = 0, overtimeHours = 0;
  let mealsCount = 0, daysCount = 0;
  let weeklyHours = {};
  let lastDay = null;

  for (const v of visits) {
    const m = moment(v.date);
    const weekKey = `${m.isoWeekYear()}-W${m.isoWeek()}`;
    if (!weeklyHours[weekKey]) weeklyHours[weekKey] = 0;

    const hours = moment.duration(
      moment(v.endTime, 'HH:mm').diff(moment(v.startTime, 'HH:mm'))
    ).asHours();

    const availableRegular = Math.max(0, child.overtimeThreshold - weeklyHours[weekKey]);
    const regH = Math.min(hours, availableRegular);
    const overH = hours - regH;

    regularHours += regH;
    overtimeHours += overH;
    totalHours += hours;

    weeklyHours[weekKey] += hours;

    if (v.hadLunch) mealsCount++;
    if (lastDay !== v.date) {
      daysCount++;
      lastDay = v.date;
    }
  }

  const regularPay = regularHours * rate;
  const overtimePay = overtimeHours * rate * multi;
  const mealsPay = mealsCount * meal;
  const servicePay = daysCount * service;
  const totalPay = regularPay + overtimePay + mealsPay + servicePay;

  return {
    totalHours, regularHours, overtimeHours,
    mealsCount, daysCount,
    totalPay, regularPay, overtimePay, mealsPay, servicePay
  };
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

  
  }

  const totalHours = regularHours + overtimeHours;

  const regularPay = regularHours * child.hourlyRate;
  const overtimePay = overtimeHours * child.hourlyRate * child.overtimeMultiplier;
  const mealsPay = mealsCount * child.mealRate;
  const servicePay = countedDays.size * child.serviceRate;
  const totalPay = regularPay + overtimePay + mealsPay + servicePay;



  return { totalHours, regularHours, overtimeHours, mealsCount, daysCount: countedDays.size, totalPay, regularPay, overtimePay, mealsPay, servicePay };
}



module.exports = { calculateMonthSummary, calculateDaySummary };
