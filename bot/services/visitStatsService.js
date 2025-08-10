// services/visitStatsService.js
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

function safeHoursBetween(startStr, endStr) {
  const start = moment(startStr, 'HH:mm', true);
  const end = moment(endStr, 'HH:mm', true);
  if (!start.isValid() || !end.isValid()) return null;
  let hours = moment.duration(end.diff(start)).asHours();
  return hours > 0 ? hours : 0;
}

// ==========================
//   Подсчёт за месяц
// ==========================
async function calculateMonthSummary(childId, yearMonth, { debug = false } = {}) {
  const child = await Child.findById(childId).lean();
  if (!child) return emptySummary();

  const overtimeThreshold = typeof child.overtimeThreshold === 'number' ? child.overtimeThreshold : Infinity;

  const startOfMonth = moment(yearMonth, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
  const endOfMonth = moment(yearMonth, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');

  const visits = await Visit.find({
    childId,
    date: { $gte: startOfMonth, $lte: endOfMonth },
    endTime: { $exists: true, $ne: null, $ne: '' },
    startTime: { $exists: true, $ne: null, $ne: '' }
  }).sort({ date: 1, startTime: 1 }).lean();

  if (!visits.length) return emptySummary();

  const rate = child.hourlyRate || 0;
  const meal = child.mealRate || 0;
  const service = child.serviceRate || 0;
  const multi = child.overtimeMultiplier || 1;

  let totalHours = 0, regularHours = 0, overtimeHours = 0;
  let mealsCount = 0;
  const daysSet = new Set();
  let weeklyHours = {};

  for (const v of visits) {
    const hours = safeHoursBetween(v.startTime, v.endTime);
    if (hours === null) {
      if (debug) console.warn('skip visit (invalid time):', v);
      continue;
    }

    const m = moment(v.date, 'YYYY-MM-DD', true);
    if (!m.isValid()) {
      if (debug) console.warn('skip visit (invalid date):', v);
      continue;
    }

    const weekKey = `${m.isoWeekYear()}-W${m.isoWeek()}`;
    if (!weeklyHours[weekKey]) weeklyHours[weekKey] = 0;

    const availableRegular = Math.max(0, overtimeThreshold - weeklyHours[weekKey]);
    const regH = Math.min(hours, availableRegular);
    const overH = hours - regH;

    regularHours += regH;
    overtimeHours += overH;
    totalHours += hours;

    weeklyHours[weekKey] += hours;

    if (v.hadLunch) mealsCount++;
    daysSet.add(v.date);
  }

  const daysCount = daysSet.size;
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

// ==========================
//   Подсчёт за день
// ==========================
async function calculateDaySummary(childId, date, { debug = false } = {}) {
  const child = await Child.findById(childId).lean();
  if (!child) return emptySummary();

  const overtimeThreshold = typeof child.overtimeThreshold === 'number' ? child.overtimeThreshold : Infinity;
  const weekStart = moment(date, 'YYYY-MM-DD').startOf('isoWeek').format('YYYY-MM-DD');

  const visits = await Visit.find({
    childId,
    date: { $gte: weekStart, $lte: date },
    endTime: { $exists: true, $ne: null, $ne: '' },
    startTime: { $exists: true, $ne: null, $ne: '' }
  }).sort({ date: 1, startTime: 1 }).lean();

  if (!visits.length) return emptySummary();

  let weeklyHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  let mealsCount = 0;
  const countedDays = new Set();

  for (const v of visits) {
    const hours = safeHoursBetween(v.startTime, v.endTime);
    if (hours === null) {
      if (debug) console.warn('skip visit (invalid time):', v);
      continue;
    }

    const visitDate = moment(v.date, 'YYYY-MM-DD', true);
    if (!visitDate.isValid()) {
      if (debug) console.warn('skip visit (invalid date):', v);
      continue;
    }

    if (visitDate.isBefore(date, 'day')) {
      weeklyHours += hours;
    } else if (visitDate.isSame(date, 'day')) {
      const availableRegular = Math.max(0, overtimeThreshold - weeklyHours);
      const regH = Math.min(hours, availableRegular);
      const overH = hours - regH;

      regularHours += regH;
      overtimeHours += overH;
      weeklyHours += hours;

      if (v.hadLunch) mealsCount++;
      countedDays.add(v.date);
    }
  }

  const totalHours = regularHours + overtimeHours;
  const regularPay = regularHours * (child.hourlyRate || 0);
  const overtimePay = overtimeHours * (child.hourlyRate || 0) * (child.overtimeMultiplier || 1);
  const mealsPay = mealsCount * (child.mealRate || 0);
  const servicePay = countedDays.size * (child.serviceRate || 0);
  const totalPay = regularPay + overtimePay + mealsPay + servicePay;

  return {
    totalHours,
    regularHours,
    overtimeHours,
    mealsCount,
    daysCount: countedDays.size,
    totalPay,
    regularPay,
    overtimePay,
    mealsPay,
    servicePay
  };
}

module.exports = { calculateMonthSummary, calculateDaySummary };
