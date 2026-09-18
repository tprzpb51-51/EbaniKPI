const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendTelegramMessage, getTelegramBotLink } = require('../services/telegramBot');
const { normalizePhone, toStoredPhone } = require('../utils/phone');

require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

const validateAge = (value) => {
  const age = Number(value);
  if (!Number.isInteger(age) || age < 1 || age > 120) {
    return null;
  }
  return age;
};

const register = async (req, res) => {
  try {
    const { name, gender, password } = req.body;
    const age = validateAge(req.body.age);
    const phone = toStoredPhone(req.body.phone);

    if (!name || age === null || !gender || normalizePhone(req.body.phone).length !== 9 || !password) {
      return res.status(400).json({ error: 'Заповніть всі поля' });
    }

    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: 'Цей номер вже зареєстрований' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      age,
      gender,
      phone,
      password: hashedPassword
    });

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '7d' });

    res.status(201).json({ message: 'Реєстрація успішна', token, userId: user.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const login = async (req, res) => {
  try {
    const { password } = req.body;
    const phone = toStoredPhone(req.body.phone);

    if (normalizePhone(req.body.phone).length !== 9 || !password) {
      return res.status(400).json({ error: 'Введіть телефон і пароль' });
    }

    const registerPushToken = async (req, res) => {
      try {
        const pushToken = typeof req.body.pushToken === 'string' ? req.body.pushToken.trim() : '';
        if (!pushToken || !pushToken.startsWith('ExponentPushToken[')) {
          return res.status(400).json({ error: 'Некоректний push token' });
        }

        await User.update({ pushToken }, { where: { id: req.userId } });
        res.json({ message: 'Push token збережено' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Не вдалося зберегти push token' });
      }
    };

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(400).json({ error: 'Користувача не знайдено' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Невірний пароль' });
    }

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '7d' });

    res.json({ message: 'Вхід успішний', token, userId: user.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'age', 'gender', 'phone', 'avatarUrl', 'phoneVerified']
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не завантажено' });
    }
    const avatarUrl = '/uploads/' + req.file.filename;
    await User.update({ avatarUrl }, { where: { id: req.userId } });
    res.json({ message: 'Аватар оновлено', avatarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const updateName = async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

    if (!name) {
      return res.status(400).json({ error: "Ім'я не може бути порожнім" });
    }
    if (name.length > 60) {
      return res.status(400).json({ error: "Ім'я не може бути довшим за 60 символів" });
    }

    await User.update({ name }, { where: { id: req.userId } });
    res.json({ message: "Ім'я оновлено", name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Помилка оновлення імені" });
  }
};

const updateAge = async (req, res) => {
  try {
    const age = validateAge(req.body.age);

    if (age === null) {
      return res.status(400).json({ error: 'Вік має бути цілим числом від 1 до 120 років' });
    }

    await User.update({ age }, { where: { id: req.userId } });
    res.json({ message: 'Вік оновлено', age });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка оновлення віку' });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const phone = toStoredPhone(req.body.phone);
    if (normalizePhone(req.body.phone).length !== 9) {
      return res.status(400).json({ error: 'Введіть коректний номер телефону' });
    }
    const user = await User.findOne({ where: { phone } });

    if (!user || !user.passwordTelegramChatId) {
      const botLink = await getTelegramBotLink('password');
      return res.status(400).json({
        code: 'PASSWORD_TELEGRAM_NOT_LINKED',
        botLink,
        error: 'Спочатку відкрийте password bot і поділіться номером телефону'
      });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const resetCodeHash = crypto.createHash('sha256').update(code).digest('hex');
    const resetCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await user.update({ resetCodeHash, resetCodeExpiresAt });
    await sendTelegramMessage(
      user.passwordTelegramChatId,
      `Код для відновлення пароля: ${code}\nДіє 10 хвилин. Не передавайте його нікому.`
      ,
      {},
      'password'
    );

    res.json({ message: 'Код відправлено в Telegram' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не вдалося відправити код' });
  }
};

const confirmPasswordReset = async (req, res) => {
  try {
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
    const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ where: { phone } });

    if (!user || !user.resetCodeHash || !user.resetCodeExpiresAt) {
      return res.status(400).json({ error: 'Код недійсний або вже використаний' });
    }
    if (new Date(user.resetCodeExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Термін дії коду закінчився' });
    }
    if (crypto.createHash('sha256').update(code).digest('hex') !== user.resetCodeHash) {
      return res.status(400).json({ error: 'Неправильний код' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Пароль має містити мінімум 4 символи' });
    }

    await user.update({
      password: await bcrypt.hash(password, 10),
      resetCodeHash: null,
      resetCodeExpiresAt: null
    });

    res.json({ message: 'Пароль успішно змінено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не вдалося змінити пароль' });
  }
};

const getTelegramLink = async (req, res) => {
  try {
    const purpose = req.query.purpose === 'password' ? 'password' : 'verification';
    const link = await getTelegramBotLink(purpose);
    res.json({ link });
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: 'Telegram-бот тимчасово недоступний' });
  }
};

const getVerificationStatus = async (req, res) => {
  try {
    const phone = toStoredPhone(req.query.phone);
    const user = await User.findOne({ where: { phone }, attributes: ['phoneVerified'] });
    res.json({ verified: Boolean(user?.phoneVerified) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  registerPushToken,
  updateAvatar,
  updateName,
  updateAge,
  requestPasswordReset,
  confirmPasswordReset,
  getTelegramLink,
  getVerificationStatus
};