const puppeteer = require('puppeteer');
const fs = require('fs');  // Import the fs module to interact with the file system

const scrapeData = async () => {
    const browser = await puppeteer.launch({ headless: false });  // Set headless to false for debugging
    const page = await browser.newPage();

    const data = [];

    try {
        for (let pageIdx = 1; pageIdx <= 2; pageIdx++) {
            const url = `https://internshala.com/fresher-jobs/jobs-in-delhi/page-${pageIdx}/`;

            await page.goto(url, { waitUntil: 'domcontentloaded' });

            // Wait for the job items to be loaded before scraping
            await page.waitForSelector('.container-fluid.individual_internship');

            const newData = await page.evaluate(() => {
                const items = document.querySelectorAll('.container-fluid.individual_internship');
                return Array.from(items).map(item => {
                    // Getting the necessary elements
                    const h3Element = item.querySelector('.job-internship-name a');
                    const locationElement = item.querySelector('.locations');
                    const salaryElementDesktop = item.querySelector('.desktop');
                    const salaryElementMobile = item.querySelector('.mobile');
                    const timeElement = item.querySelector('.status-success span');

                    // Get the text for salary from either desktop or mobile
                    const salary = salaryElementDesktop ? salaryElementDesktop.innerText.trim() :
                                   (salaryElementMobile ? salaryElementMobile.innerText.trim() : 'N/A');

                    const h3Text = h3Element ? h3Element.innerText : 'N/A';
                    const h3Link = h3Element ? h3Element.getAttribute('href') : 'N/A';
                    const location = locationElement ? locationElement.innerText.trim() : 'N/A';
                    const time = timeElement ? timeElement.innerText.trim() : 'N/A';

                    return { h3Text, h3Link: `https://internshala.com${h3Link}`, location, salary, time };
                });
            });

            data.push(...newData);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }

    return data;
};

const writeToJSON = (data) => {
    // Convert the data array to JSON format and write it to a file
    fs.writeFileSync('Internshala_jobs.json', JSON.stringify(data, null, 2), 'utf-8');
    console.log('JSON file created successfully');
};

// Main execution
(async () => {
    try {
        const data = await scrapeData();
        writeToJSON(data);  // Write data to a JSON file
    } catch (error) {
        console.error('Error:', error);
    }
})();
