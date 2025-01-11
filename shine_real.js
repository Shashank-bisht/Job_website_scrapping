const puppeteer = require('puppeteer');
const fs = require('fs');

const scrapeData = async () => {
    const browser = await puppeteer.launch({
        headless: false, // Debugging enabled
        slowMo: 50, // Slow down actions to make the scraping more visible
    });
    const page = await browser.newPage();

    const data = [];
    try {
        for (let pageIdx = 2; pageIdx <= 3; pageIdx++) { // Adjust page range as needed
            const url = `https://www.shine.com/job-search/jobs-jobs-${pageIdx}`;

            await page.goto(url, { waitUntil: 'networkidle0' }); // Wait for the page to fully load

            // Wait for the main container to ensure elements are loaded
            await page.waitForSelector('.jobCard_jobCard__jjUmu', { timeout: 10000 });

            // Check for the registration modal and close it if found
            const closeModalButtonSelector = '.register_close';
            const modalIsPresent = await page.$(closeModalButtonSelector); // Check if the modal is present

            if (modalIsPresent) {
                console.log('Registration popup detected. Closing...');
                await page.click(closeModalButtonSelector); // Click the close button
                await page.waitForSelector('.jobCard_jobCard__jjUmu', { timeout: 10000 }); // Wait for the page to reload
            }

            const newData = await page.evaluate(() => {
                const jobElements = document.querySelectorAll('.jobCard_jobCard__jjUmu'); // Main job card selector
                const jobList = [];

                jobElements.forEach(jobElement => {
                    const titleElement = jobElement.querySelector('.jobCard_pReplaceH2__xWmHg a');
                    const companyElement = jobElement.querySelector('.jobCard_jobCard_cName__mYnow span');
                    const locationElement = jobElement.querySelector('.jobCard_locationIcon__zrWt2');
                    const experienceElement = jobElement.querySelector('.jobCard_jobCard_lists_item__YxRkV.jobCard_jobIcon__3FB1t');
                    
                    // Correct selector for the "posted" date
                    const postedElement = jobElement.querySelector('.jobCard_jobCard_features__wJid6 > span:last-child'); 

                    const title = titleElement ? titleElement.innerText.trim() : 'N/A';
                    const link = titleElement ? `https://www.shine.com${titleElement.getAttribute('href')}` : 'N/A';
                    const company = companyElement ? companyElement.innerText.trim() : 'N/A';
                    const location = locationElement ? locationElement.innerText.trim() : 'N/A';
                    const experience = experienceElement ? experienceElement.innerText.trim() : 'N/A';
                    const posted = postedElement ? postedElement.innerText.trim() : 'N/A'; // Ensure this is correctly extracted

                    // Log the data for debugging purposes
                    console.log({ title, link, company, location, experience, posted });

                    jobList.push({ title, link, company, location, experience, posted });
                });

                return jobList;
            });

            data.push(...newData);
        }
    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        await browser.close();
    }

    return data;
};

const writeToJSON = (data) => {
    try {
        fs.writeFileSync('Shine_jobs.json', JSON.stringify(data, null, 2), 'utf-8');
        console.log('Job details saved successfully to Shine_jobs.json');
    } catch (error) {
        console.error('Error writing to JSON file:', error);
    }
};

// Main execution
(async () => {
    try {
        const data = await scrapeData();
        writeToJSON(data);
    } catch (error) {
        console.error('Error:', error);
    }
})();
