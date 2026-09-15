const cors = require('cors');
require('dotenv').config();
const express = require('express');
const sequelize = require('./db');
const User = require('./models/User');
const Event = require('./models/Event');
const EventParticipant = require('./models/EventParticipant');
const EventBlock = require('./models/EventBlock');
const Block = require('./models/Block');
const Message = require('./models/Message');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { startTelegramBot } = require('./services/telegramBot');
const { DataTypes, Op } = require('sequelize');

const app = express();
app.use(cors());
const PORT = 3000;

const ensureUserColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('Users');
  const missingColumns = [
    ['telegramChatId', { type: DataTypes.STRING, allowNull: true }],
    ['passwordTelegramChatId', { type: DataTypes.STRING, allowNull: true }],
    ['resetCodeHash', { type: DataTypes.STRING, allowNull: true }],
    ['resetCodeExpiresAt', { type: DataTypes.DATE, allowNull: true }]
  ];

  for (const [name, definition] of missingColumns) {
    if (!columns[name]) {
      await queryInterface.addColumn('Users', name, definition);
    }
  }
};

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('Привіт! Сервер працює!');
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);

setInterval(async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  await Event.update(
    { status: 'finished' },
    { where: { startTime: { [Op.lt]: oneHourAgo }, status: 'active' } }
  );
}, 5 * 60 * 1000);

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Файл занадто великий (максимум 10 МБ)' });
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

sequelize.sync()
  .then(() => {
    return ensureUserColumns();
  })
  .then(() => {
    console.log('База даних підключена і синхронізована');
    app.listen(PORT, () => {
      console.log(`Сервер запущено на http://localhost:${PORT}`);
      startTelegramBot();
    });
  })
  .catch((err) => {
    console.error('Помилка підключення до бази:', err);
  });