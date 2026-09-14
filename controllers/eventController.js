const Event = require('../models/Event');
const User = require('../models/User');
const EventParticipant = require('../models/EventParticipant');
const Block = require('../models/Block');
const { Op } = require('sequelize');
const sequelize = require('../db');

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const createEvent = async (req, res) => {
  try {
    const { type, ageMin, ageMax, genderPreference, maxParticipants, comment, latitude, longitude, startTime } = req.body;

    if (
      !type ||
      ageMin === undefined || ageMin === null || ageMin === '' ||
      ageMax === undefined || ageMax === null || ageMax === '' ||
      !maxParticipants ||
      latitude === undefined || latitude === null || latitude === '' ||
      longitude === undefined || longitude === null || longitude === '' ||
      !startTime
    ) {
      return res.status(400).json({ error: 'Заповніть обовʼязкові поля' });
    }

    const locationPhotoUrl = req.file ? '/uploads/' + req.file.filename : null;

    const event = await Event.create({
      type, ageMin, ageMax,
      genderPreference: genderPreference || 'будь-яка',
      maxParticipants, comment,
      latitude, longitude, locationPhotoUrl,
      startTime,
      organizerId: req.userId
    });

    res.status(201).json({ message: 'Подію створено', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const getEvents = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    const { lat, lng, radius, type } = req.query;

    const blocks = await Block.findAll({ where: { blockerId: req.userId } });
    const blockedIds = blocks.map(b => b.blockedId);

    const whereClause = {
      status: 'active',
      ageMin: { [Op.lte]: user.age },
      ageMax: { [Op.gte]: user.age },
      [Op.or]: [
        { genderPreference: 'будь-яка' },
        { genderPreference: user.gender }
      ]
    };

    if (blockedIds.length > 0) {
      whereClause.organizerId = { [Op.notIn]: blockedIds };
    }

    if (type && type !== 'всі') {
      whereClause.type = type;
    }

    let events = await Event.findAll({
      where: whereClause,
      include: [{ model: User, as: 'organizer', attributes: ['id', 'name'] }]
    });

    events = events.map(e => e.toJSON());

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = radius ? parseFloat(radius) : 5;

      events = events
        .map(e => ({
          ...e,
          distanceKm: getDistanceKm(userLat, userLng, e.latitude, e.longitude)
        }))
        .filter(e => e.distanceKm <= maxRadius)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const joinEvent = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: User, as: 'participants' }],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!event) {
      await t.rollback();
      return res.status(404).json({ error: 'Подію не знайдено' });
    }
    if (event.status !== 'active') {
      await t.rollback();
      return res.status(400).json({ error: 'Подія неактивна' });
    }
    if (event.participants.length >= event.maxParticipants) {
      await t.rollback();
      return res.status(400).json({ error: 'Немає вільних місць' });
    }

    const alreadyJoined = event.participants.find(p => p.id === req.userId);
    if (alreadyJoined) {
      await t.rollback();
      return res.status(400).json({ error: 'Ви вже приєднались' });
    }

    await event.addParticipant(req.userId, { transaction: t });
    await t.commit();

    res.json({ message: 'Ви приєднались до події' });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const myEvents = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [{ model: Event, as: 'joinedEvents' }]
    });

    const organized = await Event.findAll({ where: { organizerId: req.userId } });

    res.json({ joined: user.joinedEvents, organized });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const cancelEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Подію не знайдено' });
    if (event.organizerId !== req.userId) {
      return res.status(403).json({ error: 'Це не ваша подія' });
    }

    event.status = 'cancelled';
    await event.save();

    res.json({ message: 'Подію скасовано' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const blockUser = async (req, res) => {
  try {
    const blockedId = req.params.userId;
    await Block.create({ blockerId: req.userId, blockedId });
    res.json({ message: 'Користувача заблоковано' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

module.exports = { createEvent, getEvents, joinEvent, myEvents, cancelEvent, blockUser };