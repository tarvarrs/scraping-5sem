const superagent = require('superagent');
const cheerio = require('cheerio');
const { Article, Source, Status } = require('./models');

async function parser(url) {
    const taskStatus = await updateTaskStatus(3, 'parsing-news', 'in_progress');
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

        await markTaskCompleted(taskStatus, 'Task completed successfully.');
        console.log('Data scraping and saving completed.');

    } catch (error) {
        await markTaskFailed(taskStatus, error.message);
        console.error(`Error scraping news from ${url}:`, error.message);
    }
}


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


const url = 'https://www.nytimes.com/spotlight/german';
parser(url);
