const superagent = require('superagent');
const cheerio = require('cheerio');
const { Builder } = require('xml2js');
const fs = require('fs');

async function parser(url) {
    try {
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

            articles.push({
                title,
                description,
                author,
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
            description : item.description,
            author: item.author,
        }))
    });

    fs.writeFileSync(outputFile, xmlData, 'utf8');
    console.log(`Data saved to ${outputFile}`);
}

const url = 'https://www.nytimes.com/spotlight/german';

parser(url).then(articles => {
    if (articles && articles.length > 0) {
        saveDataToXML(articles, 'nytimes-articles.xml');
    } else {
        console.log('No articles found.');
    }
});
