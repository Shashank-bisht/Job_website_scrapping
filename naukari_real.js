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

// Function to read existing data from the JSON file
const readJobData = () => {
  try {
    const data = fs.readFileSync('naukari_jobs.json');
    return JSON.parse(data);
  } catch (err) {
    return []; // If the file does not exist or there's an error, return an empty array
  }
};

// Function to append new job data to the existing file
const appendJobData = (newData) => {
  const existingData = readJobData();
  const updatedData = [...existingData, ...newData];
  fs.writeFileSync('naukari_jobs.json', JSON.stringify(updatedData, null, 2));
};

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: false // Set to false to see the browser window (for debugging)
  });

  const page = await browser.newPage();

  // Set viewport and window size
  await page.setViewport({ width: 1366, height: 768 });

  try {
    for (let pageIdx = 240; pageIdx <= 245; pageIdx++) {
      const url = `https://www.naukri.com/jobs-in-india-${pageIdx}?k=jobs&qproductJobSource=2&naukriCampus=true&experience=0&nignbevent_src=jobsearchDeskGNB`;

      // Set a random user-agent for each request
      const userAgent = getRandomUserAgent();
      await page.setUserAgent(userAgent);

      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // Wait for the job tuple wrapper to appear
      await page.waitForSelector('.srp-jobtuple-wrapper');

      // Extracting job details from the current page
      const currentPageJobDetails = await page.evaluate(() => {
        const jobElements = document.querySelectorAll('.srp-jobtuple-wrapper');
        const detailsArray = [];

        jobElements.forEach(jobElement => {
          const title = jobElement.querySelector('.title')?.textContent.trim() || 'N/A';
          const company = jobElement.querySelector('.comp-name')?.textContent.trim() || 'N/A';
          const experience = jobElement.querySelector('.expwdth')?.textContent.trim() || 'N/A';
          const salary = jobElement.querySelector('.sal')?.textContent.trim() || 'N/A';
          const location = jobElement.querySelector('.locWdth')?.textContent.trim() || 'N/A';
          const posted = jobElement.querySelector('.job-post-day')?.textContent.trim() || 'N/A';
          const link = jobElement.querySelector('.title')?.getAttribute('href') || 'N/A';
          const name = 'Naukri'; // Static field for the company name

          detailsArray.push({ title, company, experience, salary, location, posted, link, name });
        });

        return detailsArray;
      });

      // Append job details to the JSON file after scraping each page
      appendJobData(currentPageJobDetails);

      console.log(`Page ${pageIdx} scraped successfully. Job details appended.`);

      // Add a random delay between requests (min: 5s, max: 7s)
      await delay(5000, 7000);
    }

    console.log('All pages scraped and job details appended.');

    // Close the browser after processing all pages
    await browser.close();
  } catch (error) {
    console.error('Error:', error);

    // Ensure any jobs scraped before the error are saved to the file
    const currentData = readJobData();
    fs.writeFileSync('naukari_jobs.json', JSON.stringify(currentData, null, 2));

    console.log('Data saved up to the point of the error.');

    // Close the browser in case of error
    await browser.close();
  }
})();
