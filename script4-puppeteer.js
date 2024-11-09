const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { Article, Source } = require('./models');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function parser(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    let moreButtonExists = true;
    let clickCount = 0;
    const maxClicks = 40;
    let processedCount = 0;

    try {
        let source = await Source.findOne({ where: { url } });
        if (!source) {
        source = await Source.create({ url, name: 'Nachrichtenleicht' });
    }
        const sourceId = source.id;

        while (moreButtonExists && clickCount < maxClicks) {
            const content = await page.content();
            const $ = cheerio.load(content);

            const articles = [];
            const titleSelector = 'h2.b-headline.teaser-large-headline, h2.b-headline.teaser-wide-headline';
            const descriptionSelector = 'p.teaser-large-description, p.teaser-wide-description';

            $('.teaser-wide-content, .teaser-large-content').slice(processedCount).each((index, element) => {
                const title = $(element).find(titleSelector).text().trim();
                const description = $(element).find(descriptionSelector).text().trim();
                
                if (title) {
                    articles.push({
                        title,
                        description,
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

            processedCount += articles.length;

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
parser(url).then(() => {
    console.log('Data scraping and saving completed.');
});
