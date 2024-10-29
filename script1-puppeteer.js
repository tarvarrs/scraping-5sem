const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { Builder } = require('xml2js');
const fs = require('fs');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function appendDataToXML(data, outputFile) {
    const builder = new Builder({ rootName: 'articles', xmldec: { version: '1.0', encoding: 'UTF-8' }, headless: true });
    const xmlData = builder.buildObject({
        article: data.map(item => ({
            title: item.title,
            description: item.description,
            category: item.category
        }))
    });

    fs.appendFileSync(outputFile, xmlData, 'utf8');
    console.log(`Данные добавлены в ${outputFile}`);
}

async function parser(url, outputFile) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    let articles = [];
    let moreButtonExists = true;
    let clickCount = 0;
    const maxClicks = 13;

    try {
        while (moreButtonExists && clickCount < maxClicks) {
            const content = await page.content();
            const $ = cheerio.load(content);

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

            await appendDataToXML(articles, outputFile);

            articles = [];

            moreButtonExists = await page.evaluate(() => {
                const button = document.querySelector('button[data-label="Weitere Artikel anzeigen"]');
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
        console.error(`Ошибка при парсинге: ${error.message}`);
    } finally {
        await browser.close();
    }
}

const url = 'https://www.deutschland.de/de/news';
const outputFile = 'data/deutschland-articles-v2.xml';

fs.writeFileSync(outputFile, '<?xml version="1.0" encoding="UTF-8"?><articles>', 'utf8');

parser(url, outputFile).then(() => {
    fs.appendFileSync(outputFile, '</articles>', 'utf8');
    console.log('Парсинг завершен и данные сохранены в articles.xml');
});
