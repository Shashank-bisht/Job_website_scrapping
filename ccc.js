const puppeteer = require('puppeteer');

const scrapePages = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Specify the range of pages you want to scrape
  const startPage = 1;
  const endPage = 2; // Change this to the desired end page

  const baseUrl = 'https://internshala.com/internships/computer-science,full-stack-development,mean-mern-stack,python-django,web-development-internship-in-delhi,gurgaon,noida/page-';

  const scrapedData = [];

  for (let pageCounter = startPage; pageCounter <= endPage; pageCounter++) {
    const url = `${baseUrl}${pageCounter}/`;

    await page.goto(url);

    const data = await page.evaluate(() => {
      const h3Elements = document.querySelectorAll('h3.heading_4_5.profile');

      const dataArray = [];

      h3Elements.forEach((h3Element) => {
        console.log(h3Element)
        const h3Text = h3Element.innerText.trim();
        const anchorElement = h3Element.querySelector('a.view_detail_button');
       
        const href = anchorElement ? anchorElement.getAttribute('href') : null;

        const dataObject = {
          h3Text,
          href: `https://internshala.com/${href}`
        };

        dataArray.push(dataObject);
      });

      return dataArray;
    });

    scrapedData.push(...data);
  }

  console.log(scrapedData);
  console.log(scrapedData.length);

  await browser.close();
};

scrapePages();
