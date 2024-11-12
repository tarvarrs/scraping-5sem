const superagent = require('superagent');
const cheerio = require('cheerio');
const { Article, Source, Status } = require('./models');

async function parser(url) {
    const taskStatus = await updateTaskStatus(5, 'parsing-news', 'in_progress');
    try {
        const response = await superagent.get(url);

        const $ = cheerio.load(response.text);

        const articles = [];

        const titleSelector = 'div.HeaderNews-root.HeaderNews-type_5 a';
        const categorySelector = 'div.Card-category a';

        $('article').each((index, element) => {
            const title = $(element).find(titleSelector).text().trim();
            const category = $(element).find(categorySelector).text().trim();

            if (title){
                articles.push({
                    title,
                    category
                });
            };
        });
        await markTaskCompleted(taskStatus, 'Task completed successfully.');
        return articles;

    } catch (error) {
        await markTaskFailed(taskStatus, error.message);
        console.error(`Error scraping news from ${url}:`, error.message);
    }
}

async function saveArticles(articles, sourceId) {
    for (const article of articles) {
        const is_exist = await Article.findOne({
            where: {
                title: article.title,
                sourceId
            }
        });
        if (!is_exist){
            await Article.create({
                title: article.title,
                category: article.category,
                sourceId
            });
        }
    }
    console.log(`Saved articles to the database.`);
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

const url = 'https://de.rt.com';

parser(url).then(async articles => {
    if (articles && articles.length > 0) {
        let source = await Source.findOne({ where: { url } });
        if (!source) {
            source = await Source.create({ url, name: 'RT DE' });
        }
        const sourceId = source.id;

        await saveArticles(articles, sourceId);

    } else {
        console.log('No articles found.');
    }
});
