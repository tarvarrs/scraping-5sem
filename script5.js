const superagent = require('superagent');
const cheerio = require('cheerio');
const { Builder } = require('xml2js');
const fs = require('fs');

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

            articles.push({
                title,
                category
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
            category: item.category
        }))
    });

    fs.writeFileSync(outputFile, xmlData, 'utf8');
    console.log(`Data saved to ${outputFile}`);
}

const url = 'https://de.rt.com';

parser(url).then(articles => {
    if (articles && articles.length > 0) {
        saveDataToXML(articles, 'data/de-rt-articles.xml');
    } else {
        console.log('No articles found.');
    }
});
