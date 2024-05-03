const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: false // Set to true for headless mode
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  try {
    const jobDetailsArray = []; // Initialize an array to store all job details

    const url = 'https://in.indeed.com/jobs?q=Jobs&start=0'; // URL of the first page

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.cardOutline'); // Wait for the job card elements to load

    // Extracting job details from the page
    const jobElements = await page.$$('.cardOutline');
    for (const jobElement of jobElements) {
      let title, company, location, salary, experience, postedDate;

      try {
        title = await jobElement.$eval('.jobTitle', element => element.textContent.trim());
      } catch (error) {
        title = 'N/A';
      }

      try {
        company = await jobElement.$eval('[data-testid="company-name"]', element => element.textContent.trim());
      } catch (error) {
        company = 'N/A';
      }

      try {
        location = await jobElement.$eval('[data-testid="text-location"]', element => element.textContent.trim());
      } catch (error) {
        location = 'N/A';
      }

      try {
        salary = await jobElement.$eval('.salary-snippet-container', element => element.textContent.trim());
      } catch (error) {
        salary = 'N/A';
      }

      try {
        experience = await jobElement.$eval('.css-9446fg', element => element.textContent.trim());
      } catch (error) {
        experience = 'N/A';
      }

      try {
        postedDate = await jobElement.$eval('[data-testid="myJobsStateDate"]', element => element.textContent.trim());
      } catch (error) {
        postedDate = 'N/A';
      }

      jobDetailsArray.push({ title, company, location, salary, experience, postedDate });
    }

    // Log all job details
    console.log('All job details:', jobDetailsArray);

    // Close the browser after scraping
    await browser.close();
  } catch (error) {
    console.error('Error:', error);
    await browser.close();
  }
})();
