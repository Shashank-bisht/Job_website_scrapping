const fs = require('fs');
const { MongoClient } = require('mongodb');

// Read the job data from multiple JSON files (each file represents a website)
const glassdoorJobs = JSON.parse(fs.readFileSync('glassdoor_jobs.json', 'utf-8'));
const naukriJobs = JSON.parse(fs.readFileSync('naukri_jobs.json', 'utf-8'));
const shineJobs = JSON.parse(fs.readFileSync('Shine_jobs.json', 'utf-8'));
const jobWebsite4Jobs = JSON.parse(fs.readFileSync('Internshala_jobs.json', 'utf-8'));
const jobWebsite5Jobs = JSON.parse(fs.readFileSync('indeed_jobs.json', 'utf-8'));

// Combine all job data into one array
const allJobs = [glassdoorJobs, naukriJobs, shineJobs, jobWebsite4Jobs, jobWebsite5Jobs];

// Find the maximum length of the job arrays
const maxLength = Math.max(
  glassdoorJobs.length,
  naukriJobs.length,
  shineJobs.length,
  jobWebsite4Jobs.length,
  jobWebsite5Jobs.length
);

// Create a new array to hold the interleaved jobs
let interleavedJobs = [];
// Use a Set to track added job links to avoid duplicates
let jobLinksSet = new Set();

// Function to count "N/A" fields
function countNAFields(job) {
  return Object.values(job).filter(value => value === 'N/A').length;
}

// Iterate through the maximum length and push jobs in an alternating pattern
for (let i = 0; i < maxLength; i++) {
  // Iterate through each website's job data
  for (let j = 0; j < allJobs.length; j++) {
    // If there is a job at the current index for this website, check if it already exists in the set
    if (allJobs[j][i]) {
      let job = allJobs[j][i];
      
      // Filter out jobs with more than two "N/A" fields
      if (!jobLinksSet.has(job.link) && countNAFields(job) <= 2) {
        interleavedJobs.push(job);
        jobLinksSet.add(job.link); // Add the job's link to the set
      }
    }
  }
}

// Save filtered jobs to combined.json
const combinedFilePath = 'combined.json';
try {
  fs.writeFileSync(combinedFilePath, JSON.stringify(interleavedJobs, null, 2), 'utf-8');
  console.log(`Filtered jobs have been saved to ${combinedFilePath}, overwriting old content.`);
} catch (error) {
  console.error('Error writing to combined.json:', error);
}

// MongoDB connection URI (MongoDB Atlas)
const uri = 'mongodb+srv://shashankbisht5373:v63sFiF0TsxMXoiu@cluster0.xuwpn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// The database and collection names in MongoDB Atlas
const dbName = 'jobListings'; // Database name
const collectionName = 'jobs'; // Collection name

async function storeJobsInDB(jobs) {
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB Atlas
    await client.connect();
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Insert jobs into MongoDB collection
    const result = await collection.insertMany(jobs);
    console.log(`${result.insertedCount} jobs were inserted into the database.`);

  } catch (error) {
    console.error('Error inserting jobs into MongoDB:', error);
  } finally {
    await client.close(); // Close the MongoDB connection
  }
}

// Call the function to store jobs in the database
storeJobsInDB(interleavedJobs);
