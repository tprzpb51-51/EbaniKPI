const { DataTypes } = require('sequelize');

const sequelize = require('../db');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  age: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  gender: {
    type: DataTypes.STRING,
    allowNull: false
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  phoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  telegramChatId: {
    type: DataTypes.STRING,
    allowNull: true
  },

  passwordTelegramChatId: {
    type: DataTypes.STRING,
    allowNull: true
  },

  pushToken: {
    type: DataTypes.STRING,
    allowNull: true
  },

  resetCodeHash: {
    type: DataTypes.STRING,
    allowNull: true
  },

  resetCodeExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = User;