const Message = require('../models/Message');
const Event = require('../models/Event');
const User = require('../models/User');
const EventBlock = require('../models/EventBlock');

const checkIsParticipant = async (eventId, userId) => {
  const event = await Event.findByPk(eventId, {
    include: [{ model: User, as: 'participants' }]
  });
  if (!event) return false;
  const eventBlock = await EventBlock.findOne({
    where: { eventId, blockedUserId: userId }
  });
  if (eventBlock) return false;
  const isOrganizer = event.organizerId === userId;
  const isParticipant = event.participants.some(p => p.id === userId);
  return isOrganizer || isParticipant;
};

const sendMessage = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'Повідомлення порожнє' });

    const allowed = await checkIsParticipant(eventId, req.userId);
    if (!allowed) return res.status(403).json({ error: 'Ви не учасник цієї події' });

    const message = await Message.create({ text, senderId: req.userId, eventId });

    res.status(201).json({ message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const getMessages = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const allowed = await checkIsParticipant(eventId, req.userId);
    if (!allowed) return res.status(403).json({ error: 'Ви не учасник цієї події' });

    const messages = await Message.findAll({
      where: { eventId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatarUrl'] }],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

module.exports = { sendMessage, getMessages };