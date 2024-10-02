const superagent = require('superagent');
const cheerio = require('cheerio');
const { Builder } = require('xml2js');
const fs = require('fs');

async function parser(url) {
    try {
        const response = await superagent.get(url);
        
        const $ = cheerio.load(response.text);

        const articles = [];

        const titleSelector = 'h2.b-headline.teaser-large-headline, h2.b-headline.teaser-wide-headline ';
        const descriptionSelector = 'p.teaser-large-description, p.teaser-wide-description';

        $('.teaser-wide-content, .teaser-large-content').each((index, element) => {
            const title = $(element).find(titleSelector).text().trim();
            const description = $(element).find(descriptionSelector).text().trim();

            articles.push({
                title,
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
            description: item.description
        }))
    });

    fs.writeFileSync(outputFile, xmlData, 'utf8');
    console.log(`Data saved to ${outputFile}`);
}

const url = 'https://www.nachrichtenleicht.de/nachrichtenleicht-nachrichten-100.html';

parser(url).then(articles => {
    if (articles && articles.length > 0) {
        saveDataToXML(articles, 'nachrichtenleicht-articles.xml');
    } else {
        console.log('No articles found.');
    }
});
