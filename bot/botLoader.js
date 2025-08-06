const fs = require('fs');
const path = require('path');

module.exports = async (bot) => {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (typeof command === 'function') {
      await command(bot);
    }
  }

  // Тут можно подгружать middleware, обработчики callback_query и т.п.
};
