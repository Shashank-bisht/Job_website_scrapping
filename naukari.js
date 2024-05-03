const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: false // Set to false to see the browser window (for debugging)
  });

  const page = await browser.newPage();

  // Set viewport and window size
  await page.setViewport({ width: 1366, height: 768 });

  try {
    const jobDetailsArray = []; // Initialize an array to store all job details

    for (let pageIdx = 2100; pageIdx <= 2100; pageIdx++) {
      const url = `https://www.naukri.com/jobs-in-india-${pageIdx}?k=jobs&naukriCampus=true&nignbevent_src=jobsearchDeskGNB`;

      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.srp-jobtuple-wrapper');
      // Extracting job details from the current page
      const currentPageJobDetails = await page.evaluate(() => {
        const jobElements = document.querySelectorAll('.srp-jobtuple-wrapper');

        const detailsArray = [];

        jobElements.forEach(jobElement => {
          const title = jobElement.querySelector('.title').textContent.trim();
          const company = jobElement.querySelector('.comp-name').textContent.trim();
          const experience = jobElement.querySelector('.expwdth').textContent.trim();
          const salary = jobElement.querySelector('.sal').textContent.trim();
          const location = jobElement.querySelector('.locWdth').textContent.trim();
          const posted = jobElement.querySelector('.job-post-day').textContent.trim();
          const link = jobElement.querySelector('.title').getAttribute('href');

          detailsArray.push({ title, company, experience, salary, location, posted, link });
        });

        return detailsArray;
      });

      // Push job details from the current page into the main jobDetailsArray
      jobDetailsArray.push(...currentPageJobDetails);
    }

    // Log all job details
    console.log('All job details:', jobDetailsArray);

    // Close the browser after processing all pages
    await browser.close();
  } catch (error) {
    console.error('Error:', error);
    await browser.close();
  }
})();
