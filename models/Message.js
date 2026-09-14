const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');
const Event = require('./Event');

const Message = sequelize.define('Message', {
  text: { type: DataTypes.TEXT, allowNull: false }
});

Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(Event, { foreignKey: 'eventId' });

module.exports = Message;