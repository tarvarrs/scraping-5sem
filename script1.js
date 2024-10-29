const superagent = require('superagent');
const cheerio = require('cheerio');
const { Builder } = require('xml2js');
const fs = require('fs');

async function parser(url) {
    try {
        const response = await superagent.get(url).set({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
        });
        
        const $ = cheerio.load(response.text);

        const articles = [];

        const titleSelector = 'div.teaser-small__headline, div.article-teaser-big__headline';
        const categorySelector = 'div.teaser-small__tagline, div.article-teaser-big__tagline';
        const descriptionSelector = 'div.teaser-small__summary, div.article-teaser-big__summary';

        $('.component').each((index, element) => {
            const title = $(element).find(titleSelector).text().trim();
            const category = $(element).find(categorySelector).text().trim();
            const description = $(element).find(descriptionSelector).text().trim();

            articles.push({
                title,
                category,
                description
            });
        });

        return articles;

    } catch (error) {
        console.error(`Error scraping news from ${url}:`, error.message);
    }
}

async function saveDataToXML(data, outputFile) {
    const builder = new Builder({ rootName: 'articles', xmldec: { version: '1.0', encoding: 'UTF-8' } });

    const xmlData = builder.buildObject({
        article: data.map(item => ({
            title: item.title,
            category: item.category,
            description: item.description
        }))
    });

    fs.writeFileSync(outputFile, xmlData, 'utf8');
    console.log(`Data saved to ${outputFile}`);
}

const url = 'https://www.deutschland.de/de/news';

parser(url).then(articles => {
    if (articles && articles.length > 0) {
        saveDataToXML(articles, 'data/deutschland-articles.xml');
    } else {
        console.log('No articles found.');
    }
});
