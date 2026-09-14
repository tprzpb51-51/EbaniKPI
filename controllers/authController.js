const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

const register = async (req, res) => {
  try {
    const { name, age, gender, phone, password } = req.body;

    if (!name || !age || !gender || !phone || !password) {
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

    res.status(201).json({ message: 'Реєстрація успішна', userId: user.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Введіть телефон і пароль' });
    }

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

module.exports = { register, login };