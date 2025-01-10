const puppeteer = require('puppeteer');
const fs = require('fs');  // Import fs to write to files

const scrapeData = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const data = [];

    try {
        for (let pageIdx = 1; pageIdx <= 2; pageIdx++) {
            const url = `https://internshala.com/internships/stipend-4000/page-${pageIdx}/`;

            await page.goto(url, { waitUntil: 'domcontentloaded' });

            const newData = await page.evaluate(() => {
                const items = document.querySelectorAll('.container-fluid.individual_internship');

                return Array.from(items).map(item => {
                    const h3Element = item.querySelector('.job-internship-name a');
                    const locationElement = item.querySelector('.locations a');
                    const stipendElement = item.querySelector('.stipend');
                    const durationElement = item.querySelector('.row-1-item span');
                    const timeElement = item.querySelector('.status-success span');

                    const h3Text = h3Element ? h3Element.innerText : 'N/A';
                    const h3Link = h3Element ? h3Element.getAttribute('href') : 'N/A';
                    const location = locationElement ? locationElement.innerText.trim() : 'N/A';
                    const stipend = stipendElement ? stipendElement.innerText : 'N/A';
                    const duration = durationElement ? durationElement.innerText : 'N/A';
                    const time = timeElement ? timeElement.innerText : 'N/A';

                    return { h3Text, h3Link: `https://internshala.com${h3Link}`, location, stipend, duration, time };
                });
            });

            // Check if all entries on the page are 'N/A' and break out of the loop
            if (newData.every(entry => entry.h3Text === 'N/A' && entry.stipend === 'N/A' && entry.duration === 'N/A')) {
                console.log(`All entries on page ${pageIdx} are 'N/A'. Stopping iteration.`);
                break;
            }

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
    fs.writeFileSync('internshala_intern_data.json', JSON.stringify(data, null, 2), 'utf-8');
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
