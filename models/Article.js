const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Article = sequelize.define('Article', {
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true, // createdAt, updatedAt
});

module.exports = Article;
