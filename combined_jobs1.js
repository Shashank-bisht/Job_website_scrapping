const fs = require('fs');
const { MongoClient } = require('mongodb');

// Helper function to read a large JSON file efficiently
function readLargeJsonFile(filePath) {
  let data = '';
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, 'utf-8');
    stream.on('data', chunk => {
      data += chunk;
    });
    stream.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    stream.on('error', reject);
  });
}

// Function to count "N/A" fields
function countNAFields(job) {
  return Object.values(job).filter(value => value === 'N/A').length;
}

// MongoDB connection URI (MongoDB Atlas)
const uri = 'mongodb+srv://shashankbisht5373:v63sFiF0TsxMXoiu@cluster0.xuwpn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'jobListings';
const collectionName = 'jobs';

async function storeJobsInDB(jobs) {
  const client = new MongoClient(uri);
  const batchSize = 1000; // Set a batch size to avoid overwhelming MongoDB

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Delete old data
    await collection.deleteMany({});

    // Insert in batches
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      await collection.insertMany(batch);
      console.log(`Inserted ${batch.length} jobs into the database.`);
    }
  } catch (error) {
    console.error('Error inserting jobs into MongoDB:', error);
  } finally {
    await client.close();
  }
}

// Function to remove duplicates within a single list based on job links
function removeDuplicates(jobs) {
  let uniqueJobs = [];
  let jobLinksSet = new Set();

  for (let job of jobs) {
    if (!jobLinksSet.has(job.link) && countNAFields(job) <= 2) {
      uniqueJobs.push(job);
      jobLinksSet.add(job.link); // Add the job's link to the set to track uniqueness
    }
  }

  return uniqueJobs;
}

async function processJobs() {
  try {
    // Read large JSON files
    const glassdoorJobs = await readLargeJsonFile('glassdoor_jobs.json');
    const naukriJobs = await readLargeJsonFile('naukri_jobs.json');
    const shineJobs = await readLargeJsonFile('Shine_jobs.json');
    const jobWebsite4Jobs = await readLargeJsonFile('Internshala_jobs.json');
    const jobWebsite5Jobs = await readLargeJsonFile('indeed_jobs.json');

    // Remove duplicates from each individual job list
    const uniqueGlassdoorJobs = removeDuplicates(glassdoorJobs);
    const uniqueNaukriJobs = removeDuplicates(naukriJobs);
    const uniqueShineJobs = removeDuplicates(shineJobs);
    const uniqueInternshalaJobs = removeDuplicates(jobWebsite4Jobs);
    const uniqueIndeedJobs = removeDuplicates(jobWebsite5Jobs);

    // Combine all unique jobs into one array
    const allUniqueJobs = [
      ...uniqueGlassdoorJobs,
      ...uniqueNaukriJobs,
      ...uniqueShineJobs,
      ...uniqueInternshalaJobs,
      ...uniqueIndeedJobs,
    ];

    // Save filtered jobs to combined.json
    const combinedFilePath = 'combined.json';
    fs.writeFileSync(combinedFilePath, JSON.stringify(allUniqueJobs, null, 2), 'utf-8');
    console.log(`Filtered jobs have been saved to ${combinedFilePath}.`);

    // Store jobs in MongoDB
    await storeJobsInDB(allUniqueJobs);

  } catch (error) {
    console.error('Error during processing jobs:', error);
  }
}

processJobs();
