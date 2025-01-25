const puppeteer = require('puppeteer-extra');
const fs = require('fs');  // Import the fs module to interact with the file system
const puppeteerExtraPluginStealth = require('puppeteer-extra-plugin-stealth');

(async () => {
  // Use the stealth plugin to avoid Cloudflare detection
  puppeteer.use(puppeteerExtraPluginStealth());

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: false // Set to true for headless mode
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  const jobDetailsArray = []; // Initialize an array to store all job details
  const startPage = 96; // Starting page index for scraping
  const endPage = 140;   // Ending page index (stop when the number of pages is reached)
  let currentPage = startPage;

  // Function to read the existing file and append new data to it
  const saveDataToFile = (data) => {
    try {
      // Check if the file already exists
      if (fs.existsSync('indeed_jobs.json')) {
        // If the file exists, read its content
        const existingData = JSON.parse(fs.readFileSync('indeed_jobs.json', 'utf8'));
        // Append new job details to the existing data
        existingData.push(...data);
        // Write the updated data to the file
        fs.writeFileSync('indeed_jobs.json', JSON.stringify(existingData, null, 2), 'utf-8');
      } else {
        // If the file doesn't exist, create it and write the data
        fs.writeFileSync('indeed_jobs.json', JSON.stringify(data, null, 2), 'utf-8');
      }
      console.log('Job details saved to indeed_jobs.json');
    } catch (err) {
      console.error('Error saving data to file:', err);
    }
  };

  try {
    // Set the initial URL
    await page.goto(`https://in.indeed.com/jobs?q=Jobs&start=${(currentPage - 1) * 10}`, { waitUntil: 'domcontentloaded' });

    for (let pageIdx = currentPage; pageIdx <= endPage; pageIdx++) {
      await page.waitForSelector('.cardOutline'); // Wait for the job card elements to load

      // Check for CAPTCHA presence
      const captchaIframe = await page.$('iframe[src*="recaptcha"]');
      if (captchaIframe) {
        console.log('Captcha detected, please solve it manually...');
        
        // Wait for 7 seconds before continuing, allowing manual CAPTCHA solving
        await new Promise(resolve => setTimeout(resolve, 7000)); // Wait for 7 seconds
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
          posted = 'N/A'; // Corrected typo
        }

        try {
          link = await jobElement.$eval('.jobTitle a', element => element.href);
        } catch (error) {
          link = 'N/A';
        }

        const name = 'Indeed';
        jobDetailsArray.push({ title, company, experience, salary, location, posted, link, name });
      }

      // Save data after scraping each page
      saveDataToFile(jobDetailsArray);

      // Add a delay after each page to prevent CAPTCHA triggering too often
      console.log(`Waiting for 7 seconds before loading the next page...`);
      await new Promise(resolve => setTimeout(resolve, 7000)); // Wait for 7 seconds

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

    // Final log
    console.log('All job details:', jobDetailsArray);

    // Final save in case the loop finishes without error
    saveDataToFile(jobDetailsArray);

    // Close the browser after scraping
    await browser.close();
  } catch (error) {
    console.error('Error:', error);

    // Save the job data collected up to the point of failure
    saveDataToFile(jobDetailsArray);

    // Close the browser in case of error
    await browser.close();
  }
})();
