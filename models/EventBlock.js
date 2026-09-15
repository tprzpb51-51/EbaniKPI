const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Event = require('./Event');
const User = require('./User');

const EventBlock = sequelize.define('EventBlock', {
  eventId: { type: DataTypes.INTEGER, allowNull: false },
  blockedUserId: { type: DataTypes.INTEGER, allowNull: false },
  blockedById: { type: DataTypes.INTEGER, allowNull: false }
});

EventBlock.belongsTo(Event, { foreignKey: 'eventId' });
EventBlock.belongsTo(User, { as: 'blockedUser', foreignKey: 'blockedUserId' });
EventBlock.belongsTo(User, { as: 'blockedBy', foreignKey: 'blockedById' });

module.exports = EventBlock;
