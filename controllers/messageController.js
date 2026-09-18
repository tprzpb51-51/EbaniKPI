const Message = require('../models/Message');
const Event = require('../models/Event');
const User = require('../models/User');
const EventBlock = require('../models/EventBlock');
const { sendChatPush } = require('../services/pushNotifications');

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

const getEventMember = async (eventId, userId) => {
  const event = await Event.findByPk(eventId);
  if (!event) return null;
  const allowed = await checkIsParticipant(eventId, userId);
  return allowed ? event : null;
};

const sendMessage = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'Повідомлення порожнє' });

    const allowed = await checkIsParticipant(eventId, req.userId);
    if (!allowed) return res.status(403).json({ error: 'Ви не учасник цієї події' });

    const message = await Message.create({ text, senderId: req.userId, eventId });

    const event = await Event.findByPk(eventId, {
      include: [
        { model: User, as: 'organizer', attributes: ['id', 'pushToken'] },
        { model: User, as: 'participants', attributes: ['id', 'pushToken'], through: { attributes: [] } }
      ]
    });
    const sender = await User.findByPk(req.userId, { attributes: ['name'] });
    const tokens = [event?.organizer, ...(event?.participants || [])]
      .filter((member) => member && member.id !== req.userId)
      .map((member) => member.pushToken)
      .filter(Boolean);

    sendChatPush({
      tokens,
      title: event?.type || 'Нове повідомлення',
      body: `${sender?.name || 'Учасник'}: ${text}`,
      data: { eventId: String(eventId), messageId: String(message.id) }
    }).catch((error) => console.error('Помилка push-сповіщення:', error.message));

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

const togglePinnedMessage = async (req, res) => {
  try {
    const event = await getEventMember(req.params.eventId, req.userId);
    if (!event) return res.status(403).json({ error: 'Ви не учасник цієї події' });
    if (event.organizerId !== req.userId) {
      return res.status(403).json({ error: 'Закріплювати повідомлення може лише організатор' });
    }

    const message = await Message.findOne({
      where: { id: req.params.messageId, eventId: req.params.eventId }
    });
    if (!message) return res.status(404).json({ error: 'Повідомлення не знайдено' });

    await message.update({ isPinned: !message.isPinned });
    res.json({ message, pinned: message.isPinned });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не вдалося змінити закріплення' });
  }
};

module.exports = { sendMessage, getMessages, togglePinnedMessage };