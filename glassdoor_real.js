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
            const experience = 'N/A';
            const salary = card.querySelector('.JobCard_salaryEstimate__QpbTW')?.innerText || 'N/A';
            const location = card.querySelector('.JobCard_location__Ds1fM')?.innerText || 'N/A';
            const posted = card.querySelector('.JobCard_listingAge__jJsuc')?.innerText || 'N/A';
            const link = card.querySelector('.JobCard_jobTitle__GLyJ1')?.href || 'N/A';
            const name = 'Glassdoor';
            return { title, company, experience, salary, location, posted, link, name };
        });
    });

    console.log('Jobs from the first page:', jobs);

    // Number of times you want to click the "Show More Jobs" button
    const maxClicks = 200;  // You can set this to any number
    let clickCount = 0;
    let hasNextPage = true;

    // Append initial jobs to JSON file
    fs.appendFileSync('glassdoor_jobs.json', JSON.stringify(jobs, null, 2) + ",\n", 'utf-8');

    try {
        while (clickCount < maxClicks && hasNextPage) {
            // Wait for the "Show More Jobs" button to appear
            const loadMoreButton = await page.$('button[data-test="load-more"]');
            if (loadMoreButton) {
                // Click the "Show More Jobs" button
                await loadMoreButton.click();

                // Wait for a random delay between 3-5 seconds for new jobs to load
                const delayTime = Math.floor(Math.random() * 2000) + 3000; // Random time between 3000ms and 5000ms
                console.log(`Waiting for ${delayTime / 1000} seconds before scraping more jobs...`);
                await page.waitForTimeout(delayTime); // Wait for the delay

                console.log(`Clicked "Show More Jobs" for the ${clickCount + 1} time.`);

                // Scrape additional jobs
                const additionalJobs = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('.jobCard')).map(card => {
                        const title = card.querySelector('.JobCard_jobTitle__GLyJ1')?.innerText || 'N/A';
                        const company = card.querySelector('.EmployerProfile_compactEmployerName__9MGcV')?.innerText || 'N/A';
                        const experience = 'N/A';
                        const salary = card.querySelector('.JobCard_salaryEstimate__QpbTW')?.innerText || 'N/A';
                        const location = card.querySelector('.JobCard_location__Ds1fM')?.innerText || 'N/A';
                        const posted = card.querySelector('.JobCard_listingAge__jJsuc')?.innerText || 'N/A';
                        const link = card.querySelector('.JobCard_jobTitle__GLyJ1')?.href || 'N/A';
                        const name = 'Glassdoor';
                        return { title, company, experience, salary, location, posted, link, name };
                    });
                });

                jobs = jobs.concat(additionalJobs); // Append new jobs to the existing list
                clickCount++; // Increment the counter for clicked times

                // Append the new jobs to the JSON file after each click
                fs.appendFileSync('glassdoor_jobs.json', JSON.stringify(additionalJobs, null, 2) + ",\n", 'utf-8');

                // Check if the "Show More Jobs" button is still visible
                hasNextPage = await page.$('button[data-test="load-more"]') !== null;
            } else {
                hasNextPage = false; // No more jobs to load
            }
        }
    } catch (error) {
        console.log('Error loading more jobs:', error);
    } finally {
        // Append a closing bracket at the end to properly close the JSON array
        fs.appendFileSync('glassdoor_jobs.json', ']', 'utf-8');
        console.log(`All scraped jobs after ${clickCount} clicks.`);

        // Optionally take a screenshot after scraping more jobs
        await page.screenshot({ path: 'after_loading_more_jobs.png', fullPage: true });

        await browser.close();
    }
})();
