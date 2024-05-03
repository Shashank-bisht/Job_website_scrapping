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

    // Set the range of page numbers you want to scrape
    const startPage = 0;
    const endPage = 2; // Scraping first 3 pages, adjust as needed

    for (let pageIdx = startPage; pageIdx < endPage; pageIdx++) {
      const url = `https://in.indeed.com/jobs?q=Jobs&start=${pageIdx * 10}`; // Generate URL for each page

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
          const experienceElement = await jobElement.$('.metadata .css-5zy3wz .css-1cvvo1b');
          if (experienceElement) {
            experience = await experienceElement.evaluate(element => {
              const moreItemsSpan = element.querySelector('.more-items');
              return moreItemsSpan ? moreItemsSpan.textContent.trim() : element.textContent.trim();
            });
          } else {
            experience = 'N/A';
          }
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
