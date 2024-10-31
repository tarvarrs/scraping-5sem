const superagent = require('superagent');
const cheerio = require('cheerio');
const { Article, Source } = require('./models');

async function parser(url) {
    try {
        let source = await Source.findOne({ where: { url } });
        if (!source) {
            source = await Source.create({ url, name: 'ZDF News' });
        }
        const sourceId = source.id;

        const response = await superagent.get(url);
        const $ = cheerio.load(response.text);

        const titleSelector = 'a.b7kurox.f1mro3s7.s1pyg77i';
        const categorySelector = 'span.oq6weuj.tsdggcs';

        const articles = [];

        $('.hh035ym').each((index, element) => {
            const title = $(element).find(titleSelector).text().trim();
            const category = $(element).find(categorySelector).text().trim();

            if (title) {
                articles.push({
                    title,
                    category,
                    sourceId
                });
            }
        });

        for (const article of articles) {
            await Article.create(article);
        }
        
        console.log('Data scraping and saving completed.');

    } catch (error) {
        console.error(`Error scraping news from ${url}:`, error.message);
    }
}

const url = 'https://www.zdf.de/nachrichten/thema/landtagswahl-thueringen-116.html';
parser(url);
