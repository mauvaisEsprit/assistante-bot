const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const moment = require('moment');
const { calculateHoursWithOvertime } = require('./calculateHoursWithOvertime');

async function generatePajemploiPdf(child, visits, monthStr) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;
  const marginLeft = 50;

  page.drawText(`Résumé Pajemploi – ${child.name}`, {
    x: marginLeft,
    y,
    size: 22,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.7),
  });

  y -= 35;

  page.drawText(`Mois: ${monthStr}`, {
    x: marginLeft,
    y,
    size: 14,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });
  y -= 20;

  page.drawText(`Date du rapport: ${moment().format('DD/MM/YYYY')}`, {
    x: marginLeft,
    y,
    size: 12,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 30;

  page.drawLine({
    start: { x: marginLeft, y },
    end: { x: width - marginLeft, y },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  y -= 20;

  const { totalHours, regularHours, overtimeHours, totalMeal, totalService, totalDays } = calculateHoursWithOvertime(visits, child);

  const salary =
    regularHours * child.hourlyRate +
    overtimeHours * child.hourlyRate * child.overtimeMultiplier +
    totalMeal +
    totalService;

  function drawRow(label, value, posY, options = {}) {
    const labelX = marginLeft;
    const valueX = width - marginLeft - 100;
    page.drawText(label, {
      x: labelX,
      y: posY,
      size: options.size || 12,
      font: options.bold ? fontBold : fontRegular,
      color: options.color || rgb(0, 0, 0),
    });
    page.drawText(value, {
      x: valueX,
      y: posY,
      size: options.size || 12,
      font: options.bold ? fontBold : fontRegular,
      color: options.color || rgb(0, 0, 0),
    });
  }

  drawRow('Total jours:', totalDays.toString(), y);
  y -= 20;
  drawRow('Heures normales:', regularHours.toFixed(2), y);
  y -= 20;
  drawRow('Heures supplémentaires:', overtimeHours.toFixed(2), y);
  y -= 20;
  drawRow('Salaire heures:', `€ ${(regularHours * child.hourlyRate).toFixed(2)}`, y);
  y -= 20;
  drawRow('Supplément:', `€ ${(overtimeHours * child.hourlyRate * child.overtimeMultiplier).toFixed(2)}`, y);
  y -= 20;
  drawRow('Repas:', `€ ${totalMeal.toFixed(2)}`, y);
  y -= 20;
  drawRow('Services:', `€ ${totalService.toFixed(2)}`, y);
  y -= 20;

  page.drawLine({
    start: { x: marginLeft, y: y - 5 },
    end: { x: width - marginLeft, y: y - 5 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  y -= 25;

  drawRow('Total payé:', `€ ${salary.toFixed(2)}`, y, { bold: true, size: 14, color: rgb(0, 0.3, 0) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { generatePajemploiPdf };
