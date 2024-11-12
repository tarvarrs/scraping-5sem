const Sequelize = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

const Article = require('./Article')(sequelize);
const Source = require('./Source')(sequelize);
const Status = require('./Status')(sequelize);

module.exports = {
    sequelize,
    Article,
    Source,
    Status
};
