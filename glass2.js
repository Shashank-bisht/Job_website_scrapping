const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false }); // Set to false to see the browser
    const page = await browser.newPage();

    // Go to the website
    await page.goto('https://www.glassdoor.co.in/Job/jobs.htm');

    // Wait for the search bar to load
    await page.waitForSelector('#searchBar-jobTitle');

    // Take a screenshot of the initial page
    await page.screenshot({ path: 'before_search.png', fullPage: true });

    // Enter the job title
    await page.type('#searchBar-jobTitle', 'jobs', { delay: 100 });

    // Enter the location
    await page.type('#searchBar-location', 'India', { delay: 100 });

    // Submit the search
    await page.keyboard.press('Enter');

    // Wait for the results to load
    await page.waitForSelector('.jobCard', { timeout: 10000 });

    // Take a screenshot of the search results page
    await page.screenshot({ path: 'after_search.png', fullPage: true });

    // Scrape job details (as before)
    const jobs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.jobCard')).map(card => {
            const title = card.querySelector('.JobCard_jobTitle__GLyJ1')?.innerText || 'N/A';
            const company = card.querySelector('.EmployerProfile_compactEmployerName__9MGcV')?.innerText || 'N/A';
            const location = card.querySelector('.JobCard_location__Ds1fM')?.innerText || 'N/A';
            const salary = card.querySelector('.JobCard_salaryEstimate__QpbTW')?.innerText || 'N/A';
            const age = card.querySelector('.JobCard_listingAge__jJsuc')?.innerText || 'N/A';
            const applyLink = card.querySelector('.JobCard_jobTitle__GLyJ1')?.href || 'N/A';
            return { title, company, location, salary, age, applyLink };
        });
    });

    console.log(jobs);

    await browser.close();
})();
