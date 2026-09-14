require('dotenv').config();
const express = require('express');
const sequelize = require('./db');
const User = require('./models/User');
const Event = require('./models/Event');
const EventParticipant = require('./models/EventParticipant');
const Block = require('./models/Block');
const Message = require('./models/Message');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { Op } = require('sequelize');

const app = express();
const PORT = 3000;

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

sequelize.sync()
  .then(() => {
    console.log('База даних підключена і синхронізована');
    app.listen(PORT, () => {
      console.log(`Сервер запущено на http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Помилка підключення до бази:', err);
  });