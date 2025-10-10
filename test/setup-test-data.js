const fs = require('fs');
const path = require('path');

// Create sample test data for the tests
const resultsFolder = path.join(__dirname, '../results');

// Ensure results folder exists
if (!fs.existsSync(resultsFolder)) {
  fs.mkdirSync(resultsFolder, { recursive: true });
}

// Sample test data
const sampleResults = [
  {
    key: 'starwars',
    DateTime: new Date().toISOString(),
    value: 'Green',
    TestCount: 10,
    FailedTestCount: 0,
    AvgResponseTime: 150,
    IncludeInStats: 1
  },
  {
    key: 'starwars',
    DateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    value: 'Green',
    TestCount: 10,
    FailedTestCount: 0,
    AvgResponseTime: 160,
    IncludeInStats: 1
  },
  {
    key: 'starwars',
    DateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    value: 'Amber',
    TestCount: 10,
    FailedTestCount: 2,
    AvgResponseTime: 200,
    IncludeInStats: 1
  },
  {
    key: 'another-feature',
    DateTime: new Date().toISOString(),
    value: 'Green',
    TestCount: 5,
    FailedTestCount: 0,
    AvgResponseTime: 100,
    IncludeInStats: 1
  }
];

// Write test results file
const testResultsFile = path.join(resultsFolder, 'testresults.json');
const histTestResultsFile = path.join(resultsFolder, 'hist_testresults.json');

// Write current results
fs.writeFileSync(testResultsFile, sampleResults.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log('Created test results file:', testResultsFile);

// Write history results (for historical data queries)
fs.writeFileSync(histTestResultsFile, sampleResults.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log('Created historical test results file:', histTestResultsFile);

// Create dev and staging files as well (for other tests)
const devResultsFile = path.join(resultsFolder, 'devresults.json');
const histDevResultsFile = path.join(resultsFolder, 'hist_devresults.json');
const stagingResultsFile = path.join(resultsFolder, 'stagingresults.json');
const histStagingResultsFile = path.join(resultsFolder, 'hist_stagingresults.json');

fs.writeFileSync(devResultsFile, sampleResults.map(r => JSON.stringify(r)).join('\n') + '\n');
fs.writeFileSync(histDevResultsFile, sampleResults.map(r => JSON.stringify(r)).join('\n') + '\n');
fs.writeFileSync(stagingResultsFile, sampleResults.map(r => JSON.stringify(r)).join('\n') + '\n');
fs.writeFileSync(histStagingResultsFile, sampleResults.map(r => JSON.stringify(r)).join('\n') + '\n');

console.log('Test data setup complete!');
