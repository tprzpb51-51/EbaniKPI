const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const Event = sequelize.define('Event', {
  type: { type: DataTypes.STRING, allowNull: false },
  ageMin: { type: DataTypes.INTEGER, allowNull: false },
  ageMax: { type: DataTypes.INTEGER, allowNull: false },
  genderPreference: { type: DataTypes.STRING, defaultValue: 'будь-яка' },
  maxParticipants: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: true },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  locationPhotoUrl: { type: DataTypes.STRING, allowNull: true },
  startTime: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'active' }
});

Event.belongsTo(User, { as: 'organizer', foreignKey: 'organizerId' });

module.exports = Event;