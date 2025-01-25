const puppeteer = require('puppeteer');
const fs = require('fs');  // Import the fs module to interact with the file system

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
    const browser = await puppeteer.launch({ headless: false });  // Set headless to false for debugging
    const page = await browser.newPage();

    const data = [];
    try {
        for (let pageIdx = 2; pageIdx <= 131; pageIdx++) {
            const url = `https://internshala.com/jobs/page-${pageIdx}/`;

            // Set a random user-agent for each request
            const userAgent = getRandomUserAgent();
            await page.setUserAgent(userAgent);

            await page.goto(url, { waitUntil: 'domcontentloaded' });

            // Wait for the job items to be loaded before scraping
            await page.waitForSelector('.container-fluid.individual_internship');

            const newData = await page.evaluate(() => {
                const items = document.querySelectorAll('.container-fluid.individual_internship');
                return Array.from(items).map(item => {
                    // Getting the necessary elements
                    const h3Element = item.querySelector('.job-internship-name a');
                    const companyNameElement = item.querySelector('.company-name');
                    const experienceElement = item.querySelector('.row-1-item .ic-16-briefcase + span'); // Correct experience selector
                    const salaryElementDesktop = item.querySelector('.desktop');
                    const salaryElementMobile = item.querySelector('.mobile');
                    const locationElement = item.querySelector('.locations');
                    const postedTimeElementStatus = item.querySelector('.status-success span'); // For status-success
                    const postedTimeElementReschedule = item.querySelector('.ic-16-reschedule span'); // For ic-16-reschedule
                    const postedTimeElementInactive = item.querySelector('.status-inactive span'); 
                    const postedTimeElementStatusinfo = item.querySelector('.status-info span')
                    // Get job title and link
                    const title = h3Element ? h3Element.innerText.trim() : 'N/A';
                    // Get company name
                    const company = companyNameElement ? companyNameElement.innerText.trim() : 'N/A';
                    
                    // Get experience (e.g., "1-3 years")
                    const experience = experienceElement ? experienceElement.innerText.trim() : 'N/A';

                    // Get the text for salary from either desktop or mobile
                    const salary = salaryElementDesktop ? salaryElementDesktop.innerText.trim() :
                                   (salaryElementMobile ? salaryElementMobile.innerText.trim() : 'N/A');
                                   
                   // Get location
                   const location = locationElement ? locationElement.innerText.trim() : 'N/A';

                   // Get posted time (e.g., "1 day ago" or "Few hours ago")
                   const posted = postedTimeElementStatus ? postedTimeElementStatus.innerText.trim() :
                      postedTimeElementReschedule ? postedTimeElementReschedule.innerText.trim() :
                      postedTimeElementInactive ? postedTimeElementInactive.innerText.trim(): postedTimeElementStatusinfo ? postedTimeElementStatusinfo.innerText.trim() : 'N/A';

                    // link
                    const link = h3Element ? h3Element.getAttribute('href') : 'N/A';

                    const name = 'Internshala'; // Company name

                    // Return the structured data
                    return { title, company, experience, salary, location, posted, link: `https://internshala.com${link}`, name };
                });
            });

            data.push(...newData);

            // Add a random delay between requests (min: 5s, max: 7s)
            await delay(5000, 7000);
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
