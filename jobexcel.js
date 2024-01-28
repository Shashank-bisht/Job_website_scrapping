const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

const scrapeData = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const data = [];

    try {
        for (let pageIdx = 1; pageIdx <= 20; pageIdx++) {
            const url = `https://internshala.com/fresher-jobs/jobs-in-delhi/page-${pageIdx}/`;

            await page.goto(url, { waitUntil: 'domcontentloaded' });

            const newData = await page.evaluate(() => {
                const items = document.querySelectorAll('.container-fluid.individual_internship');

                return Array.from(items).map(item => {
                    const h3Element = item.querySelector('.heading_4_5.profile a');
                    const locationElement = item.querySelector('.location_link');
                    const salaryElement = item.querySelector('.other_detail_item_row .other_detail_item:nth-child(2) .item_body');

                    const h3Text = h3Element ? h3Element.innerText : 'N/A';
                    const h3Link = h3Element ? h3Element.getAttribute('href') : 'N/A';
                    const location = locationElement ? locationElement.innerText.trim() : 'N/A';
                    const salary = salaryElement ? salaryElement.innerText : 'N/A';

                    return { h3Text, h3Link: `https://internshala.com${h3Link}`,location, salary };
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

const writeToExcel = async (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('New Jobs');

    // Add headers to the worksheet
    worksheet.addRow(['Job Title', 'Job Link','location', 'Salary']);

    // Add data to the worksheet
    data.forEach(job => {
        worksheet.addRow([job.h3Text, job.h3Link,job.location, job.salary]);
    });

    // Save the workbook to a file
    await workbook.xlsx.writeFile('New_jobs.xlsx');
    console.log('Excel file created successfully');
};

// Main execution
(async () => {
    try {
        const data = await scrapeData();
        await writeToExcel(data);
    } catch (error) {
        console.error('Error:', error);
    }
})();
