const puppeteer = require('puppeteer');
const fs = require('fs');  // File system module to write data to a file

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

    // Scrape job details from the first page
    let jobs = await page.evaluate(() => {
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

    console.log('Jobs from the first page:', jobs);

    // Number of times you want to click the "Show More Jobs" button
    const maxClicks = 3;  // You can set this to any number
    let clickCount = 0;
    let hasNextPage = true;

    while (clickCount < maxClicks && hasNextPage) {
        try {
            // Wait for the "Show More Jobs" button to appear
            const loadMoreButton = await page.$('button[data-test="load-more"]');
            if (loadMoreButton) {
                // Click the "Show More Jobs" button
                await loadMoreButton.click();
                // Wait for the next batch of jobs to load
                await page.waitForTimeout(5000); // Wait for 5 seconds for new jobs to load
                console.log(`Clicked "Show More Jobs" for the ${clickCount + 1} time.`);

                // Scrape additional jobs
                const additionalJobs = await page.evaluate(() => {
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

                jobs = jobs.concat(additionalJobs); // Append new jobs to the existing list
                clickCount++; // Increment the counter for clicked times

                // Check if the "Show More Jobs" button is still visible
                hasNextPage = await page.$('button[data-test="load-more"]') !== null;
            } else {
                hasNextPage = false; // No more jobs to load
            }
        } catch (error) {
            console.log('Error loading more jobs:', error);
            hasNextPage = false; // Stop if there's an error (e.g., no more jobs)
        }
    }

    console.log(`All scraped jobs after ${clickCount} clicks:`, jobs);

    // Write the scraped jobs to a JSON file
    fs.writeFileSync('glassdoor_jobs.json', JSON.stringify(jobs, null, 2), 'utf-8');

    // Optionally take a screenshot after scraping more jobs
    await page.screenshot({ path: 'after_loading_more_jobs.png', fullPage: true });

    await browser.close();
})();
