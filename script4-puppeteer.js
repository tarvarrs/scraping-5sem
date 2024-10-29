const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { Builder } = require('xml2js');
const fs = require('fs');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function appendDataToXML(data, outputFile) {
    const builder = new Builder({ rootName: 'articles', xmldec: { version: '1.0', encoding: 'UTF-8' } });
    const xmlData = builder.buildObject({
        article: data.map(item => ({
            title: item.title,
            description: item.description
        }))
    });

    fs.appendFileSync(outputFile, xmlData, 'utf8');
    console.log(`Data added to ${outputFile}`);
}

async function parser(url, outputFile) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    let articles = [];
    let moreButtonExists = true;
    let clickCount = 0;
    const maxClicks = 40;

    try {
        while (moreButtonExists && clickCount < maxClicks) {
            const content = await page.content();
            const $ = cheerio.load(content);

            const titleSelector = 'h2.b-headline.teaser-large-headline, h2.b-headline.teaser-wide-headline';
            const descriptionSelector = 'p.teaser-large-description, p.teaser-wide-description';

            $('.teaser-wide-content, .teaser-large-content').each((index, element) => {
                const title = $(element).find(titleSelector).text().trim();
                const description = $(element).find(descriptionSelector).text().trim();

                articles.push({
                    title,
                    description
                });
            });

            await appendDataToXML(articles, outputFile);

            articles = [];

            moreButtonExists = await page.evaluate(() => {
                const button = document.querySelector('.content-loader-btn-more.js-load-more-button');
                if (button) {
                    button.click();
                    return true;
                }
                return false;
            });

            clickCount++;
            await delay(3000);
        }

    } catch (error) {
        console.error(`Error scraping news from ${url}:`, error.message);
    } finally {
        await browser.close();
    }
}

const url = 'https://www.nachrichtenleicht.de/nachrichtenleicht-nachrichten-100.html';
const outputFile = 'data/nachrichtenleicht-articles-v2.xml';

fs.writeFileSync(outputFile, '<?xml version="1.0" encoding="UTF-8"?><articles>', 'utf8');

parser(url, outputFile).then(() => {
    fs.appendFileSync(outputFile, '</articles>', 'utf8');
    console.log('Data saved to xml file.');
});
