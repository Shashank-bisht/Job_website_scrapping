const puppeteer = require('puppeteer');
const fs = require('fs');  // Import the fs module to interact with the file system

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: false // Set to true for headless mode
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  try {
    const jobDetailsArray = []; // Initialize an array to store all job details

    const startPage = 4; // Starting page index for scraping
    const endPage = 10;   // Ending page index (stop when the number of pages is reached)
    let currentPage = startPage;

    // Set the initial URL
    await page.goto(`https://in.indeed.com/jobs?q=Jobs&start=${(currentPage - 1) * 10}`, { waitUntil: 'domcontentloaded' });

    for (let pageIdx = currentPage; pageIdx <= endPage; pageIdx++) {
      await page.waitForSelector('.cardOutline'); // Wait for the job card elements to load

      // Check for CAPTCHA presence
      const captchaIframe = await page.$('iframe[src*="recaptcha"]');
      if (captchaIframe) {
        console.log('Captcha detected, trying to solve...');

        // Wait for the CAPTCHA iframe to load
        const iframe = await page.frames().find(frame => frame.url().includes('recaptcha'));

        // Wait for the checkbox to appear and click it
        await iframe.waitForSelector('.recaptcha-checkbox');
        await iframe.click('.recaptcha-checkbox');

        // Wait for CAPTCHA to process (This is just a simulation of the click, real CAPTCHA solving may need API)
        console.log('Captcha clicked, waiting for processing...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds

        // Continue to the next page after CAPTCHA is bypassed
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
      }

      // Extracting job details from the current page
      const jobElements = await page.$$('.cardOutline');
      for (const jobElement of jobElements) {
        let title, company, experience, salary, location, posted, link;

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
          salary = await jobElement.$eval('.salary-snippet-container', element => element.textContent.trim());
        } catch (error) {
          salary = 'N/A';
        }

        try {
          location = await jobElement.$eval('[data-testid="text-location"]', element => element.textContent.trim());
        } catch (error) {
          location = 'N/A';
        }

        try {
          posted = await jobElement.$eval('[data-testid="myJobsStateDate"]', element => element.textContent.trim());
        } catch (error) {
          postedDate = 'N/A';
        }

        try {
          link = await jobElement.$eval('.jobTitle a', element => element.href);
        } catch (error) {
          link = 'N/A';
        }
        const name = 'Indeed';
        jobDetailsArray.push({ title, company, experience, salary, location, posted, link, name });
      }

      // Add a delay after each page to prevent CAPTCHA triggering too often
      console.log(`Waiting for 10 seconds before loading the next page...`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds

      // Try to click the "Next Page" button
      try {
        const nextButton = await page.$('a[data-testid="pagination-page-next"]');
        if (nextButton) {
          await nextButton.click();
          await page.waitForNavigation({ waitUntil: 'domcontentloaded' }); // Wait for the next page to load
        } else {
          console.log("Next button not found, stopping pagination.");
          break;  // Stop if the "Next" button is not found
        }
      } catch (error) {
        console.error('Error clicking the next button:', error);
        break;  // Stop if there's an error clicking the next button
      }
    }

    // Log all job details
    console.log('All job details:', jobDetailsArray);

    // Write the job details array to a JSON file
    fs.writeFileSync('indeed_jobs.json', JSON.stringify(jobDetailsArray, null, 2), 'utf-8');

    console.log('Job details saved to indeed_jobs.json');

    // Close the browser after scraping
    await browser.close();
  } catch (error) {
    console.error('Error:', error);
    await browser.close();
  }
})();
