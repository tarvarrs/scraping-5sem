const { sequelize, Article, Source } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync({ force: true });
    console.log('All models were synchronized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
})();
