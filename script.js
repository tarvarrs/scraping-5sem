const superagent = require('superagent');
const cheerio = require('cheerio');
const { Builder } = require('xml2js');
const fs = require('fs');

const websites = [
    {
        url: 'https://www.deutschland.de/de/news',
        selectors: {
            title: 'div.teaser-small__headline',
            summary: 'div.teaser-small__summary',
            category: 'div.teaser-small__tagline, div.article-teaser-big__tagline'
        }
    },
    {
        url: 'https://www.zdf.de/nachrichten/thema/landtagswahl-thueringen-116.html',
        selectors: {
            title: 'a.b7kurox.f1mro3s7.s1pyg77i',
            category: 'span.oq6weuj.tsdggcs'
        }
    },
    {
        url: 'https://www.nytimes.com/spotlight/german',
        selectors: {
            title: 'h3.css-1j88qqx.e15t083i0',
            description: 'p.css-1pga48a.e15t083i1',
            date: 'div.css-agsgss.e15t083i3 span[data-testid="todays-date"]',
            author: 'span.css-1n7hynb'
        }
    },
    {
        url: 'https://www.nachrichtenleicht.de/nachrichtenleicht-nachrichten-100.html',
        selectors: {
            title: 'h2.b-headline.teaser-large-headline, h2.b-headline.teaser-wide-headline',
            description: 'p.teaser-large-description, p.teaser-wide-description'
        }
    },
    {
        url: 'https://de.rt.com',
        selectors: {
            category: 'div.Card-category a',
            description: 'div.HeaderNews-root.HeaderNews-type_5 a',
            date: 'div.Card-meta time'
        }
    }
];

// Function to scrape a single website
async function scrapeWebsite(website) {
    try {
        const response = await superagent.get(website.url);
        const $ = cheerio.load(response.text);

        // Extract data using the provided selectors
        const title = $(website.selectors.title).text().trim();
        const description = $(website.selectors.description).text().trim();
        const date = $(website.selectors.date).text().trim();

        return {
            title,
            description,
            date
        };
    } catch (err) {
        console.error(`Error scraping ${website.url}:`, err.message);
        return null;
    }
}

// Function to scrape all websites and build XML
async function scrapeAndBuildXML() {
    const data = [];

    // Scrape each website and collect the results
    for (const website of websites) {
        const siteData = await scrapeWebsite(website);
        if (siteData) {
            data.push({
                site: {
                    url: website.url,
                    title: siteData.title,
                    description: siteData.description,
                    date: siteData.date
                }
            });
        }
    }

    // Convert to XML
    const builder = new Builder();
    const xml = builder.buildObject({ websites: data });

    // Output the XML dataset
    console.log(xml);
}

// Run the scraper and build the XML
scrapeAndBuildXML();
