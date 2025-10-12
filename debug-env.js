// Test script to verify environment loading
console.log('Testing environment configuration...');

fetch('/config')
  .then(response => response.json())
  .then(data => {
    console.log('Config loaded:', data);
    console.log('Environments:', data.environments);
    
    if (data.environments && data.environments.length > 0) {
      console.log('✅ Environments found:', data.environments.length);
      data.environments.forEach((env, index) => {
        console.log(`  ${index + 1}. ${env.id} - ${env.displayName}`);
      });
    } else {
      console.log('❌ No environments found in config');
    }
  })
  .catch(error => {
    console.error('❌ Error loading config:', error);
  });

// Test production results
fetch('/results/prod')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Production results loaded:', data.length, 'items');
    if (data.length > 0) {
      console.log('First item environment:', data[0].Environment);
    }
  })
  .catch(error => {
    console.error('❌ Error loading production results:', error);
  });
