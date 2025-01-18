const puppeteer = require('puppeteer');
const fs = require('fs');

// Function to add a random delay (in milliseconds)
const delay = (min = 5000, max = 7000) => {
    const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delayTime));
};

// Function to generate a random User-Agent
const getRandomUserAgent = () => {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36',
        'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:53.0) Gecko/20100101 Firefox/53.0',
        'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36 Edge/17.17134',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
        'Mozilla/5.0 (Windows NT 6.1; rv:56.0) Gecko/20100101 Firefox/56.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36'
    ];
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomIndex];
};

const scrapeData = async () => {
    const browser = await puppeteer.launch({
        headless: false, // Debugging enabled
        slowMo: 50, // Slow down actions to make the scraping more visible
    });
    const page = await browser.newPage();
    
    const data = [];
    try {
        for (let pageIdx = 2; pageIdx <= 40; pageIdx++) { // Adjust page range as needed
            const url = `https://www.shine.com/job-search/jobs-jobs-jobs-in-india-${pageIdx}?q=jobs-jobs&loc=india`;

            // Set a random user-agent for each request
            const userAgent = getRandomUserAgent();
            await page.setUserAgent(userAgent);

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
                    const experienceElement = jobElement.querySelector('.jobCard_jobCard_lists_item__YxRkV.jobCard_jobIcon__3FB1t');
                    const locationElement = jobElement.querySelector('.jobCard_locationIcon__zrWt2');
                    
                    // Correct selector for the "posted" date
                    const postedElement = jobElement.querySelector('.jobCard_jobCard_features__wJid6 > span:last-child'); 

                    const title = titleElement ? titleElement.innerText.trim() : 'N/A';
                    const company = companyElement ? companyElement.innerText.trim() : 'N/A';
                    const experience = experienceElement ? experienceElement.innerText.trim() : 'N/A';
                    const salary = 'N/A'
                    const location = locationElement ? locationElement.innerText.trim() : 'N/A';
                    const posted = postedElement ? postedElement.innerText.trim() : 'N/A'; // Ensure this is correctly extracted
                    const link = titleElement ? `https://www.shine.com${titleElement.getAttribute('href')}` : 'N/A';
                    const name = 'Shine';

                    jobList.push({title, company, experience, salary, location, posted, link, name});
                });

                return jobList;
            });

            data.push(...newData);

            // Add a random delay between requests (min: 5s, max: 7s)
            await delay(5000, 7000);
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
