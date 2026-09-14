const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Block = sequelize.define('Block', {
  blockerId: { type: DataTypes.INTEGER, allowNull: false },
  blockedId: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Block;