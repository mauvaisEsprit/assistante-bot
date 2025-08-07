const moment = require('moment');

function calculateHours(startTime, endTime) {
  let start = moment(startTime, 'HH:mm');
  let end = moment(endTime, 'HH:mm');
  if (end.isBefore(start)) {
    end.add(1, 'day');
  }
  return moment.duration(end.diff(start)).asHours();
}

function calculateHoursWithOvertime(visits, child) {
  const weeklyHours = {};
  let totalHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  let uniqueDays = new Set();
  let totalMeal = 0;
  let totalService = 0;

  for (const v of visits) {
    const m = moment(v.date);
    const weekKey = `${m.isoWeekYear()}-W${m.isoWeek()}`;
    if (!weeklyHours[weekKey]) weeklyHours[weekKey] = 0;

    const hours = calculateHours(v.startTime, v.endTime);
    totalHours += hours;

    const availableRegular = Math.max(0, child.overtimeThreshold - weeklyHours[weekKey]);
    const regH = Math.min(hours, availableRegular);
    const overH = hours - regH;

    regularHours += regH;
    overtimeHours += overH;

    weeklyHours[weekKey] += hours;

    uniqueDays.add(v.date);

    if (v.hadLunch) totalMeal += child.mealRate;
    if (v.hadDinner) totalMeal += child.mealRate;
    totalService += child.serviceRate;
  }

  return { totalHours, regularHours, overtimeHours, totalMeal, totalService, totalDays: uniqueDays.size };
}

module.exports = { calculateHoursWithOvertime };
