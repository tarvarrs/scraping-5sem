const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { Article, Source, Status } = require('./models');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function parser(url) {
    const taskStatus = await updateTaskStatus(1, 'parsing-news', 'in_progress'); // <-- lab 4
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load' });

    let moreButtonExists = true;
    let clickCount = 0;
    const maxClicks = 13;
    let processedCount = 0;

    try {
        let source = await Source.findOne({ where: { url } }); // <-- modified to skip duplicates
        if (!source) {
            source = await Source.create({ url, name: 'Deutschland News' });
        }
        const sourceId = source.id;

        while (moreButtonExists && clickCount < maxClicks) {
            const content = await page.content();
            const $ = cheerio.load(content);

            const articles = [];
            const titleSelector = 'div.teaser-small__headline, div.article-teaser-big__headline';
            const categorySelector = 'div.teaser-small__tagline, div.article-teaser-big__tagline';
            const descriptionSelector = 'div.teaser-small__summary, div.article-teaser-big__summary';

            $('.component').slice(processedCount).each((index, element) => {
                const title = $(element).find(titleSelector).text().trim();
                const category = $(element).find(categorySelector).text().trim();
                const description = $(element).find(descriptionSelector).text().trim();

                if (title) {
                    articles.push({
                        title,
                        category,
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
                const button = document.querySelector('button[data-label="Weitere Artikel anzeigen"]');
                if (button) {
                    button.click();
                    return true;
                }
                return false;
            });

            clickCount++;
            await delay(1000);
        }
        await markTaskCompleted(taskStatus, 'Task completed successfully.');
    } catch (error) {
        console.error(`Error scraping news from ${url}:`, error.message);
        await markTaskFailed(taskStatus, error.message);
    } finally {
        await browser.close();
    }
}

// lab 4
async function updateTaskStatus(sourceId, taskName, status, message = '') {
    const taskStatus = await Status.create({
        taskName,
        status,
        message,
        startTime: new Date(),
        sourceId,
    });

    return taskStatus;
}

async function markTaskCompleted(taskStatus, message = '') {
    taskStatus.status = 'completed';
    taskStatus.endTime = new Date();
    taskStatus.message = message;
    await taskStatus.save();
}

async function markTaskFailed(taskStatus, message = '') {
    taskStatus.status = 'failed';
    taskStatus.endTime = new Date();
    taskStatus.message = message;
    await taskStatus.save();
}


const url = 'https://www.deutschland.de/de/news';
parser(url).then(() => {
    console.log('Data scraping and saving completed.');
});
