require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const connectDB = require('./config/db'); // путь зависит от структуры
const webhook = require('./webhook'); // компонент для регистрации вебхука
const botLoader = require('./botLoader'); // загрузка бота и команд





// 1. Подключение к MongoDB
connectDB();

// 2. Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN);


  // Загружаем все команды и хендлеры через отдельный модуль
//botLoader(bot);

// 3. Инициализация Express
const app = express();
app.use(express.json());

// 4. Регистрируем вебхук с ботом
(async () => {
  await webhook(app, bot);
  console.log('✅ Вебхук зарегистрирован');
})().catch(err => {
  console.error('❌ Ошибка при регистрации вебхука:', err);
});

app.get('/ping', (req, res) => {
  res.send('Pong!');
});




// 5. Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
