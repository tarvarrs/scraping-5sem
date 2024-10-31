const { Model, DataTypes } = require('sequelize');
const Source = require('./Source');

module.exports = (sequelize) => {
  class Article extends Model {}

  Article.init({
      title: DataTypes.STRING,
      description: DataTypes.TEXT,
      category: DataTypes.STRING,
      author: DataTypes.STRING
  }, {
      sequelize,
      modelName: 'Article',
      tableName: 'articles'
  });

  Article.belongsTo(Source(sequelize), { foreignKey: 'sourceId', as: 'source' });
  return Article;
};
