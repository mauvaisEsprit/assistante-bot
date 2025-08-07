const express = require("express");
const start = require("./commands/start");
const childSelect = require("./commands/childSelect");
const childrenList = require("./commands/childrenList");
const back = require("./commands/back"); // если есть команда "назад"
const editPrice = require("./commands/editPrice"); // если есть команда "редактировать цену"
const addHours = require("./commands/addHours");
const history = require("./commands/history");
const { Telegraf, session } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);
const pinCodeHandler = require("./handlers/pinCodeHandler");

module.exports = async (app, bot) => {
  // Путь вебхука
  const endpoint = "/telegram-webhook";

  app.use(express.json());
  // Инициализация сессий
  bot.use(session());

  // Регистрация команд
  start(bot);
  pinCodeHandler(bot);
  childSelect(bot);
  childrenList(bot);
  back(bot); // если есть команда "назад"
  editPrice(bot); // если есть команда "редактировать цену"
  addHours(bot);
  history(bot);

  app.post(endpoint, (req, res) => {
    bot.handleUpdate(req.body, res);
  });

  // Регистрация синего меню команд
  await bot.telegram.setMyCommands([
    { command: "start", description: "Redémarrer le bot" },
  ]);

  // Установка вебхука
  await bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}${endpoint}`);
};
