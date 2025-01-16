const puppeteer = require('puppeteer');
const fs = require('fs');  // Import the fs module to interact with the file system

const scrapeData = async () => {
    const browser = await puppeteer.launch({ headless: false });  // Set headless to false for debugging
    const page = await browser.newPage();

    const data = [];
    try {
        for (let pageIdx = 1; pageIdx <= 2; pageIdx++) {
            const url = `https://internshala.com/jobs/page-${pageIdx}/`;

            await page.goto(url, { waitUntil: 'domcontentloaded' });

            // Wait for the job items to be loaded before scraping
            await page.waitForSelector('.container-fluid.individual_internship');

            const newData = await page.evaluate(() => {
                const items = document.querySelectorAll('.container-fluid.individual_internship');
                return Array.from(items).map(item => {
                    // Getting the necessary elements
                    const h3Element = item.querySelector('.job-internship-name a');
                    const companyNameElement = item.querySelector('.company-name');
                    const experienceElement = item.querySelector('.row-1-item .ic-16-briefcase + span'); // Correct experience selector
                    const salaryElementDesktop = item.querySelector('.desktop');
                    const salaryElementMobile = item.querySelector('.mobile');
                    const locationElement = item.querySelector('.locations');
                    const postedTimeElementStatus = item.querySelector('.status-success span'); // For status-success
                    const postedTimeElementReschedule = item.querySelector('.ic-16-reschedule span'); // For ic-16-reschedule
                    
                    
                    // Get job title and link
                    const title = h3Element ? h3Element.innerText.trim() : 'N/A';
                    // Get company name
                    const company = companyNameElement ? companyNameElement.innerText.trim() : 'N/A';
                    
                    // Get experience (e.g., "1-3 years")
                    const experience = experienceElement ? experienceElement.innerText.trim() : 'N/A';

                    // Get the text for salary from either desktop or mobile
                    const salary = salaryElementDesktop ? salaryElementDesktop.innerText.trim() :
                                   (salaryElementMobile ? salaryElementMobile.innerText.trim() : 'N/A');
                                   
                   // Get location
                   const location = locationElement ? locationElement.innerText.trim() : 'N/A';

                   // Get posted time (e.g., "1 day ago" or "Few hours ago")
                   const posted = postedTimeElementStatus ? postedTimeElementStatus.innerText.trim() : 
                                  (postedTimeElementReschedule ? postedTimeElementReschedule.innerText.trim() : 'N/A');
                    // link
                    const link = h3Element ? h3Element.getAttribute('href') : 'N/A';

                 ///  company name 
                   const name = 'Internshala'


                    // Return the structured data
                    return { title, company, experience, salary, location, posted , link: `https://internshala.com${link}`, name};
                });
            });

            data.push(...newData);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }

    return data;
};

const writeToJSON = (data) => {
    // Convert the data array to JSON format and write it to a file
    fs.writeFileSync('Internshala_jobs.json', JSON.stringify(data, null, 2), 'utf-8');
    console.log('JSON file created successfully');
};

// Main execution
(async () => {
    try {
        const data = await scrapeData();
        writeToJSON(data);  // Write data to a JSON file
    } catch (error) {
        console.error('Error:', error);
    }
})();
