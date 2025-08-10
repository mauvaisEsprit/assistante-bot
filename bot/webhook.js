const express = require("express");
const start = require("./commands/start");
const childSelect = require("./commands/childSelect");
const childrenList = require("./commands/childrenList");
const back = require("./commands/back"); // если есть команда "назад"
const editPrice = require("./commands/editPrice"); // если есть команда "редактировать цену"
const addHours = require("./commands/addHours");
const history = require("./commands/history");
const { Telegraf, session } = require("telegraf");
const pinCodeHandler = require("./handlers/pinCodeHandler");
const pajemploi = require("./commands/pajemploi");
const checkInOut = require("./commands/checkInOut");


const bodyParser = require("body-parser");

module.exports = async (app, bot) => {
  const endpoint = "/telegram-webhook";

  // НЕ ставим express.json() на маршрут вебхука, чтобы Telegraf мог сам парсить тело
  // app.use(express.json()); // <-- УБРАТЬ или поставить ниже, но не на /telegram-webhook

  // Регистрируем middleware сессий
  bot.use(session());

  // Регистрируем webhook callback для Telegraf
  app.use(bot.webhookCallback(endpoint));

  // Регистрация команд и хендлеров
  pinCodeHandler(bot);
  start(bot);
  childrenList(bot);
  childSelect(bot);
  back(bot);
  editPrice(bot);
  addHours(bot);
  history(bot);
  pajemploi(bot);
  checkInOut(bot);
 

  // Регистрируем команды для Telegram меню
  await bot.telegram.setMyCommands([
    { command: "start", description: "Redémarrer le bot" },
  ]);

  // Устанавливаем webhook в Telegram
  await bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}${endpoint}`);

  // Можно оставить express.json() для других маршрутов, но НЕ для webhook
  app.use(
    express.json({
      strict: true,
      limit: "1mb",
      // optional: пропускать путь webhook
      // verify: (req, res, buf) => {
      //   if (req.originalUrl === endpoint) throw new Error('Skip JSON parsing for webhook');
      // }
    })
  );
};
