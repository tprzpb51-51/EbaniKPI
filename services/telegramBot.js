const User = require('../models/User');
const { normalizePhone } = require('../utils/phone');

const bots = {
  verification: {
    token: process.env.TELEGRAM_VERIFICATION_BOT_TOKEN,
    offset: 0,
    pollingStarted: false
  },
  password: {
    token: process.env.TELEGRAM_PASSWORD_BOT_TOKEN,
    offset: 0,
    pollingStarted: false
  }
};

const telegramRequest = async (purpose, method, body) => {
  const bot = bots[purpose];
  if (!bot?.token) {
    throw new Error(`${purpose} Telegram bot token is not configured`);
  }

  const response = await fetch(`https://api.telegram.org/bot${bot.token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API error: ${response.status}`);
  }

  return data.result;
};

const sendTelegramMessage = async (chatId, text, extra = {}, purpose = 'password') => {
  return telegramRequest(purpose, 'sendMessage', { chat_id: chatId, text, ...extra });
};

const getTelegramBotLink = async (purpose = 'verification') => {
  const bot = await telegramRequest(purpose, 'getMe');
  return bot.username ? `https://t.me/${bot.username}` : null;
};

const contactKeyboard = {
  keyboard: [[{ text: 'Поділитися номером телефону', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true
};

const findUserByPhone = async (phone) => {
  const phoneDigits = normalizePhone(phone);
  const users = await User.findAll({ attributes: ['id', 'phone'] });
  return users.find((user) => normalizePhone(user.phone) === phoneDigits);
};

const handleUpdate = async (purpose, update) => {
  const message = update.message;
  if (!message) return;

  const chatId = String(message.chat.id);
  if (message.text === '/start' || message.text === '/verify') {
    const text = purpose === 'verification'
      ? 'Щоб підтвердити акаунт, поділіться номером телефону.'
      : 'Щоб відновлювати пароль, поділіться номером телефону.';
    await sendTelegramMessage(chatId, text, { reply_markup: contactKeyboard }, purpose);
    return;
  }

  if (!message.contact) {
    await sendTelegramMessage(chatId, 'Скористайтеся кнопкою «Поділитися номером телефону».', {}, purpose);
    return;
  }

  const user = await findUserByPhone(message.contact.phone_number);
  if (!user) {
    await sendTelegramMessage(
      chatId,
      'Користувача з таким номером не знайдено. Спочатку зареєструйтеся в застосунку.',
      {},
      purpose
    );
    return;
  }

  if (purpose === 'verification') {
    await user.update({ telegramChatId: chatId, phoneVerified: true });
    await sendTelegramMessage(
      chatId,
      'Номер підтверджено. Тепер ви можете створювати події.',
      { reply_markup: { remove_keyboard: true } },
      purpose
    );
  } else {
    await user.update({ passwordTelegramChatId: chatId });
    await sendTelegramMessage(
      chatId,
      'Password bot привʼязано. Тепер тут приходитимуть коди відновлення.',
      { reply_markup: { remove_keyboard: true } },
      purpose
    );
  }
};

const poll = async (purpose) => {
  const bot = bots[purpose];
  try {
    const updates = await telegramRequest(purpose, 'getUpdates', {
      offset: bot.offset,
      timeout: 20,
      allowed_updates: ['message']
    });

    for (const update of updates) {
      bot.offset = update.update_id + 1;
      try {
        await handleUpdate(purpose, update);
      } catch (error) {
        console.error(`Помилка обробки ${purpose} Telegram-повідомлення:`, error.message);
      }
    }
  } catch (error) {
    console.error(`Помилка ${purpose} Telegram polling:`, error.message);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  if (bot.pollingStarted) poll(purpose);
};

const startBot = (purpose) => {
  const bot = bots[purpose];
  if (!bot.token) {
    console.log(`${purpose} Telegram bot вимкнено: токен не налаштований`);
    return;
  }
  if (bot.pollingStarted) return;

  bot.pollingStarted = true;
  console.log(`${purpose} Telegram bot запущено через long polling`);
  poll(purpose);
};

const startTelegramBot = () => {
  startBot('verification');
  startBot('password');
};

module.exports = { startTelegramBot, sendTelegramMessage, getTelegramBotLink };
