const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const sequelize = require('../models/index');
const Article = require('../models/Article');

async function importArticlesFromXML(filePath) {
    const parser = new xml2js.Parser();
    
    try {
        const xmlData = fs.readFileSync(filePath, 'utf8');
        const result = await parser.parseStringPromise(xmlData);

        if (result && result.articles && result.articles.article) {
            const articles = result.articles.article;

            for (const item of articles) {
                const { title, description, category, author } = item;

                await Article.create({
                    title: title ? title[0] : null,
                    description: description ? description[0] : null,
                    category: category ? category[0] : null,
                    author: author ? author[0] : null,
                });
            }

            console.log(`Data from ${filePath} imported successfully.`);
        } else {
            console.log(`No articles found in ${filePath}.`);
        }
    } catch (error) {
        console.error('Error parsing XML file:', error);
    }
}

async function importAllXMLFromDirectory(directoryPath) {
    try {
        const files = fs.readdirSync(directoryPath);
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            if (path.extname(file) === '.xml') {
                await importArticlesFromXML(filePath);
            }
        }
        console.log('All XML files have been processed.');
    } catch (error) {
        console.error('Error reading directory:', error);
    }
}

(async () => {
    try {
        await sequelize.sync();
        await importAllXMLFromDirectory('data');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
