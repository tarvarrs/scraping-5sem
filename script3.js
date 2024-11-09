const superagent = require('superagent');
const cheerio = require('cheerio');
const { Article, Source } = require('./models');

async function parser(url) {
    try {
        let source = await Source.findOne({ where: { url } });
        if (!source) {
            source = await Source.create({ url, name: 'The New York Times' });
        }
        const sourceId = source.id;

        const response = await superagent.get(url);
        const $ = cheerio.load(response.text);

        const articles = [];

        const titleSelector = 'h3.css-1j88qqx.e15t083i0';
        const descriptionSelector = 'p.css-1pga48a.e15t083i1';
        const authorSelector = 'span.css-1n7hynb';

        $('.css-14ee9cx').each((index, element) => {
            const title = $(element).find(titleSelector).text().trim();
            const description = $(element).find(descriptionSelector).text().trim();
            const author = $(element).find(authorSelector).text().trim();

            if (title) {
                articles.push({
                    title,
                    description,
                    author,
                    sourceId
                });
            }
        });

        for (const article of articles) {
            const is_exist = await Article.findOne({
                where: {
                    title: article.title,
                    sourceId
                }
            });
            if (!is_exist){
                await Article.create(article);
            };
        }

        console.log('Data scraping and saving completed.');

    } catch (error) {
        console.error(`Error scraping news from ${url}:`, error.message);
    }
}

const url = 'https://www.nytimes.com/spotlight/german';
parser(url);
