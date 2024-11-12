const superagent = require('superagent');
const cheerio = require('cheerio');
const { Article, Source, Status } = require('./models');

async function parser(url) {
    const taskStatus = await updateTaskStatus(2, 'parsing-news', 'in_progress');
    try {
        let source = await Source.findOne({ where: { url } });
        if (!source) {
            source = await Source.create({ url, name: 'ZDF News' });
        }
        const sourceId = source.id;

        const response = await superagent.get(url);
        const $ = cheerio.load(response.text);

        const titleSelector = 'a.b7kurox.f1mro3s7.s1pyg77i';
        const categorySelector = 'span.oq6weuj.tsdggcs';

        const articles = [];

        $('.hh035ym').each((index, element) => {
            const title = $(element).find(titleSelector).text().trim();
            const category = $(element).find(categorySelector).text().trim();

            if (title) {
                articles.push({
                    title,
                    category,
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
        console.error(`Error scraping news from ${url}:`, error.message);
        await markTaskFailed(taskStatus, error.message);
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

const url = 'https://www.zdf.de/nachrichten/thema/landtagswahl-thueringen-116.html';
parser(url);
