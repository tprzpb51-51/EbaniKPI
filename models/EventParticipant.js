const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');
const Event = require('./Event');

const EventParticipant = sequelize.define('EventParticipant', {
  status: { type: DataTypes.STRING, defaultValue: 'joined' }
});

Event.belongsToMany(User, { through: EventParticipant, as: 'participants' });
User.belongsToMany(Event, { through: EventParticipant, as: 'joinedEvents' });

module.exports = EventParticipant;