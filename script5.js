const superagent = require('superagent');
const cheerio = require('cheerio');
const { Article, Source } = require('./models');

async function parser(url) {
    try {
        const response = await superagent.get(url);

        const $ = cheerio.load(response.text);

        const articles = [];

        const titleSelector = 'div.HeaderNews-root.HeaderNews-type_5 a';
        const categorySelector = 'div.Card-category a';

        $('article').each((index, element) => {
            const title = $(element).find(titleSelector).text().trim();
            const category = $(element).find(categorySelector).text().trim();

            if (title){
                articles.push({
                    title,
                    category
                });
            };
        });

        return articles;

    } catch (error) {
        console.error(`Error scraping news from ${url}:`, error.message);
    }
}

async function saveArticles(articles, sourceId) {
    for (const article of articles) {
        const is_exist = await Article.findOne({
            where: {
                title: article.title,
                sourceId
            }
        });
        if (!is_exist){
            await Article.create({
                title: article.title,
                category: article.category,
                sourceId
            });
        }
    }
    console.log(`Saved articles to the database.`);
}

const url = 'https://de.rt.com';

parser(url).then(async articles => {
    if (articles && articles.length > 0) {
        let source = await Source.findOne({ where: { url } });
        if (!source) {
            source = await Source.create({ url, name: 'RT DE' });
        }
        const sourceId = source.id;

        await saveArticles(articles, sourceId);
    } else {
        console.log('No articles found.');
    }
});
