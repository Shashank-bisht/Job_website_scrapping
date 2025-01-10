const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeJobs(url) {
    const browser = await puppeteer.launch({
        headless: false, // Set to false to see the browser in action
        userDataDir: 'C:\\Users\\shashank bisht\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1', // Adjust as needed
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        defaultViewport: null,
        timeout: 60000,
    });

    const page = await browser.newPage();

    // Check if the page is opened successfully
    page.on('load', () => {
        console.log('Page loaded:', page.url());
    });

    await page.goto(url, { waitUntil: 'networkidle2' });

    let jobData = [];
    let previousHeight;

    try {
        // Infinite scroll loop
        while (true) {
            const newJobs = await page.evaluate(() => {
                const jobList = Array.from(document.querySelectorAll('ul[aria-label="Jobs List"] > li'));
                return jobList.map(job => ({
                    company: job.querySelector('.EmployerProfile_compactEmployerName__LE242')?.innerText || 'No Company Name',
                    location: job.querySelector('.JobCard_location__rCz3x')?.innerText || 'No Location',
                    salary: job.querySelector('.JobCard_salaryEstimate__arV5J')?.innerText || 'No Salary Info',
                    datePosted: job.querySelector('.JobCard_listingAge__Ny_nG')?.innerText || 'No Date Info',
                }));
            });

            newJobs.forEach(newJob => {
                if (!jobData.some(job => job.company === newJob.company && job.location === newJob.location)) {
                    jobData.push(newJob);
                }
            });

            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForTimeout(2000);

            const newHeight = await page.evaluate('document.body.scrollHeight');
            if (newHeight === previousHeight) {
                break;
            }
        }

        console.log(jobData);
        fs.writeFileSync('jobData.json', JSON.stringify(jobData, null, 2));

    } catch (error) {
        console.error('Error scraping jobs:', error);
    } finally {
        await browser.close();
    }
}

scrapeJobs('https://www.glassdoor.co.in/Job/index.htm');
