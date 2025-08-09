require("dotenv").config();
const express = require("express");
const { Telegraf } = require("telegraf");
const connectDB = require("./config/db"); // путь зависит от структуры
const webhook = require("./webhook"); // компонент для регистрации вебхука

// 1. Подключение к MongoDB
connectDB();

// 2. Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN.trim());
console.log("✅ Бот инициализирован");

// 3. Инициализация Express
const app = express();

// 4. Регистрируем вебхук с ботом
(async () => {
  await webhook(app, bot);
  console.log("✅ Вебхук зарегистрирован");
})().catch((err) => {
  console.error("❌ Ошибка при регистрации вебхука:", err);
});

// 4. Подключаем UpTime robot
app.get("/ping", (req, res) => {
  res.send("Pong!");
});

// 5. Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
