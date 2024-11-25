const express = require('express');
const path = require('path');
const db = require('./models');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

db.sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
}).catch(err => console.error('Ошибка подключения к БД:', err));