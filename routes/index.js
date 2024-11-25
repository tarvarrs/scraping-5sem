const express = require('express');
const router = express.Router();
const db = require('../models');

const ignoredWords = ['alles', 'einen', 'was', 'als', 'und', 'der', 'die', 'das', 'mit', 'für', 'um', 'zur', 'zu', 'zum', 'ist', 'an', 'ein', 'von', 'nicht', 'des', 'hat', 'nach', 'vor', 'will', 'den', 'dem', 'haben', 'bei', 'sich', 'eine', 'am', 'aus', 'ab', 'im', 'auf', 'uber'];
const MAX_WORDS = 50;

router.get('/', async (req, res) => {
    try {
        const articles = await db.Article.findAll();

        const categoryCounts = {};
        const wordCounts = {};

        articles.forEach(article => {
            if (article.category) {
                categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
            }

            if (article.title) {
                article.title.split(' ').forEach(word => {
                    const cleanedWord = word.toLowerCase().replace(/[^a-zа-яё]/gi, '');
                    if (cleanedWord && !ignoredWords.includes(cleanedWord)){
                        wordCounts[word] = (wordCounts[word] || 0) + 1;
                    }
                });
            }
        });

        const categoryData = Object.keys(categoryCounts)
        .filter(category => categoryCounts[category] >= 5)
        .map(category => ({
            category,
            count: categoryCounts[category],
        }));

        const wordcloudData = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, MAX_WORDS);

        res.render('index', { categoryData, wordcloudData });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).send('Ошибка сервера');
    }
});

module.exports = router;