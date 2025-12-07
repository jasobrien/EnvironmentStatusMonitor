#!/usr/bin/env node

/**
 * Utility script to initialize a new environment
 * Usage: node scripts/init-environment.js <env-id> <env-name> <env-displayName>
 * Example: node scripts/init-environment.js qa QA "Quality Assurance"
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/init-environment.js <env-id> <env-name> [env-displayName]');
  console.error('Example: node scripts/init-environment.js qa QA "Quality Assurance"');
  process.exit(1);
}

const envId = args[0];
const envName = args[1];
const envDisplayName = args[2] || envName;

console.log(`Initializing environment: ${envId} (${envDisplayName})`);

// Validate environment ID (should be lowercase alphanumeric)
if (!/^[a-z0-9]+$/.test(envId)) {
  console.error('Error: Environment ID must be lowercase alphanumeric (e.g., dev, test, qa, prod)');
  process.exit(1);
}

// Define paths
const resultsDir = path.join(__dirname, '..', 'results');
const environmentsDir = path.join(__dirname, '..', 'environments');
const collectionsDir = path.join(__dirname, '..', 'collections');

// Create result files with empty arrays
const resultFile = path.join(resultsDir, `${envId}results.json`);
const histResultFile = path.join(resultsDir, `hist_${envId}results.json`);

function createFileIfNotExists(filePath, defaultContent) {
  if (fs.existsSync(filePath)) {
    console.log(`  ⚠️  File already exists: ${path.basename(filePath)}`);
    return false;
  }
  
  fs.writeFileSync(filePath, defaultContent, 'utf8');
  console.log(`  ✓ Created: ${path.basename(filePath)}`);
  return true;
}

console.log('\nCreating result files:');
createFileIfNotExists(resultFile, '[]');
createFileIfNotExists(histResultFile, '[]');

// Create environment file template
console.log('\nCreating environment file:');
const envFile = path.join(environmentsDir, `envstatus_${envId}.json`);
const envTemplate = {
  id: `environment-${envId}`,
  name: `Environment Status - ${envDisplayName}`,
  values: [
    {
      key: "baseUrl",
      value: `https://${envId}.example.com`,
      type: "default",
      enabled: true
    }
  ],
  _postman_variable_scope: "environment"
};

createFileIfNotExists(envFile, JSON.stringify(envTemplate, null, 2));

// Instructions for updating config
console.log('\n' + '='.repeat(70));
console.log('✅ Environment files created successfully!');
console.log('='.repeat(70));
console.log('\n📝 Next steps:');
console.log('\n1. Add the environment to config/config.js:');
console.log('\n   environments: [');
console.log('     { id: "dev", name: "Dev", displayName: "Development" },');
console.log('     { id: "test", name: "Test", displayName: "Test" },');
console.log('     { id: "staging", name: "Staging", displayName: "Staging" },');
console.log(`     { id: "${envId}", name: "${envName}", displayName: "${envDisplayName}" }`);
console.log('   ]');
console.log('\n2. Create/update your Postman collections in:');
console.log(`   collections/${envId}_collection.json`);
console.log('\n3. Restart the server to activate the new environment');
console.log('\n4. The following routes will be automatically available:');
console.log(`   - GET  /results/${envId}/`);
console.log(`   - GET  /getSummaryStats/${envId}`);
console.log(`   - GET  /histresultskeys/${envId}`);
console.log(`   - GET  /run${envName}`);
console.log(`   - GET  /data/${envId}results (results editor)`);
console.log(`   - GET  /readyToDeploy/${envId}`);
console.log('\n5. The dashboard will automatically display the new environment');
console.log('='.repeat(70) + '\n');
