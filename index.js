const puppeteer = require('puppeteer');

const scrapeData = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const data = [];

  try {
    for (let pageIdx = 1; pageIdx <= 3; pageIdx++) {
      const url = `https://internshala.com/internships/computer-science,full-stack-development,mean-mern-stack,python-django,web-development-internship-in-delhi,gurgaon,noida/page-${pageIdx}/`;
      
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const newData = await page.evaluate(() => {
        const items = document.querySelectorAll('.container-fluid.individual_internship');

        return Array.from(items).map(item => {
          const h3Element = item.querySelector('.heading_4_5.profile a');
          const stipendElement = item.querySelector('.stipend_container .stipend');
          const durationElement = item.querySelector('.other_detail_item_row .other_detail_item:nth-child(2) .item_body');

          const h3Text = h3Element ? h3Element.innerText : 'N/A';
          const h3Link = h3Element ? h3Element.getAttribute('href') : 'N/A';
          const stipend = stipendElement ? stipendElement.innerText : 'N/A';
          const duration = durationElement ? durationElement.innerText : 'N/A';

          return { h3Text, h3Link:`https://internshala.com${h3Link}`, stipend, duration };
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

scrapeData().then(result => console.log(result)).catch(error => console.error(error));
