const puppeteer = require("puppeteer");
const ExcelJS = require("exceljs");

const scrapeData = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const data = [];
  try {
    for (let pageIdx = 1; pageIdx <= 10; pageIdx++) {
      const url = `https://internshala.com/internships/computer-science,full-stack-development,mean-mern-stack,python-django,web-development-internship-in-delhi,gurgaon,noida/page-${pageIdx}/`;

      await page.goto(url, { waitUntil: "domcontentloaded" });

      const newData = await page.evaluate(() => {
        const items = document.querySelectorAll(
          ".container-fluid.individual_internship"
        );

        return Array.from(items).map((item) => {
          const titleElement = item.querySelector(".job-internship-name");
          const companyElement = item.querySelector(".company-name");
          const locationElement = item.querySelector(".locations span a");
          const stipendElement = item.querySelector(".stipend");
          const durationElement = item.querySelector(".ic-16-calendar + span");
          const timeElement = item.querySelector('.status-info span, .status-success span');

          const title = titleElement ? titleElement.innerText.trim() : "N/A";
          const company = companyElement ? companyElement.innerText.trim() : "N/A";
          const location = locationElement ? locationElement.innerText.trim() : "N/A";
          const stipend = stipendElement ? stipendElement.innerText.trim() : "N/A";
          const duration = durationElement ? durationElement.innerText.trim() : "N/A";
          const time = timeElement ? timeElement.innerText.trim() : "N/A";

          return {
            title,
            company,
            location,
            stipend,
            duration,
            time
          };
        });
      });

      if (
        newData.every(
          (entry) =>
            entry.title === "N/A" &&
            entry.company === "N/A" &&
            entry.stipend === "N/A" &&
            entry.duration === "N/A" &&
            entry.time === 'N/A'
        )
      ) {
        console.log(
          `All entries on page ${pageIdx} are 'N/A'. Stopping iteration.`
        );
        break;
      }

      data.push(...newData);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }

  return data;
};

const writeToExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Internship");

  // Add headers to the worksheet
  worksheet.addRow(["Title", "Company", "Location", "Stipend", "Duration", "Posted Time"]);

  // Add data to the worksheet
  data.forEach((job) => {
    worksheet.addRow([
      job.title,
      job.company,
      job.location,
      job.stipend,
      job.duration,
      job.time
    ]);
  });

  // Save the workbook to a file
  await workbook.xlsx.writeFile("Internshi.xlsx");
  console.log("Excel file created successfully");
};

// Main execution
(async () => {
  try {
    const data = await scrapeData();
    await writeToExcel(data);
  } catch (error) {
    console.error("Error:", error);
  }
})();
