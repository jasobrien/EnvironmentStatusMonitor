// Configuration management JavaScript

let originalConfig = {};

// Load configuration on page load
document.addEventListener('DOMContentLoaded', function() {
    loadConfiguration();
    setupEventListeners();
});

function setupEventListeners() {
    // Toggle authentication card visibility based on session setting
    document.getElementById('session').addEventListener('change', function() {
        const authCard = document.getElementById('authCard');
        if (this.value === 'true') {
            authCard.style.display = 'block';
        } else {
            authCard.style.display = 'none';
        }
    });
}

async function loadConfiguration() {
    try {
        showStatus('Loading configuration...', 'info');
        
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const config = await response.json();
        originalConfig = JSON.parse(JSON.stringify(config)); // Deep copy
        
        populateForm(config);
        showStatus('Configuration loaded successfully', 'success');
        
        // Hide status after 3 seconds
        setTimeout(() => {
            document.getElementById('saveStatus').innerHTML = '';
        }, 3000);
        
    } catch (error) {
        console.error('Error loading configuration:', error);
        showStatus('Error loading configuration: ' + error.message, 'error');
    }
}

function populateForm(config) {
    // Web configuration
    document.getElementById('pageTitle').value = config.web?.page_title || '';
    document.getElementById('refreshInterval').value = config.web?.refresh || '';
    document.getElementById('env1Name').value = config.web?.Env1Name || '';
    document.getElementById('env2Name').value = config.web?.Env2Name || '';
    document.getElementById('env3Name').value = config.web?.Env3Name || '';
    document.getElementById('email').value = config.web?.email || '';
    document.getElementById('animation').value = config.web?.animation || 'true';
    
    // System configuration
    document.getElementById('env1').value = config.ENV1 || '';
    document.getElementById('env2').value = config.ENV2 || '';
    document.getElementById('env3').value = config.ENV3 || '';
    document.getElementById('greenThreshold').value = config.Green || '';
    document.getElementById('amberThreshold').value = config.Amber || '';
    document.getElementById('cronLocation').value = config.CronLocation || '';
    document.getElementById('session').value = config.session ? 'true' : 'false';
    
    // Authentication
    document.getElementById('username').value = config.user || '';
    // Don't populate password field for security
    
    // Features
    document.getElementById('influx').value = config.Influx ? 'true' : 'false';
    document.getElementById('extendedLog').value = config.ExtendedLog ? 'true' : 'false';
    
    // Toggle auth card visibility
    const authCard = document.getElementById('authCard');
    if (config.session) {
        authCard.style.display = 'block';
    } else {
        authCard.style.display = 'none';
    }
}

async function saveConfig() {
    try {
        showStatus('Saving configuration...', 'info');
        
        const formData = new FormData(document.getElementById('configForm'));
        const config = {};
        
        // Build configuration object from form data
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('web.')) {
                if (!config.web) config.web = {};
                const webKey = key.replace('web.', '');
                config.web[webKey] = value;
            } else {
                // Convert string boolean values to actual booleans
                if (value === 'true') {
                    config[key] = true;
                } else if (value === 'false') {
                    config[key] = false;
                } else if (!isNaN(value) && value !== '') {
                    // Convert numeric strings to numbers
                    config[key] = Number(value);
                } else {
                    config[key] = value;
                }
            }
        }
        
        // Don't include password if it's empty (keep existing password)
        if (!config.password || config.password.trim() === '') {
            delete config.password;
        }
        
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        showStatus('Configuration saved successfully! Server restart required for changes to take effect.', 'success');
        
        // Update original config to new saved state
        originalConfig = JSON.parse(JSON.stringify(config));
        
    } catch (error) {
        console.error('Error saving configuration:', error);
        showStatus('Error saving configuration: ' + error.message, 'error');
    }
}

function resetConfig() {
    if (confirm('Are you sure you want to reset all changes? This will discard any unsaved modifications.')) {
        populateForm(originalConfig);
        showStatus('Configuration reset to original values', 'info');
        
        // Hide status after 3 seconds
        setTimeout(() => {
            document.getElementById('saveStatus').innerHTML = '';
        }, 3000);
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('saveStatus');
    let alertClass = 'alert-info';
    let icon = 'ℹ️';
    
    switch (type) {
        case 'success':
            alertClass = 'alert-success';
            icon = '✅';
            break;
        case 'error':
            alertClass = 'alert-danger';
            icon = '❌';
            break;
        case 'warning':
            alertClass = 'alert-warning';
            icon = '⚠️';
            break;
    }
    
    statusDiv.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <span aria-hidden="true">${icon}</span> ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    `;
}

// Utility function to check if there are unsaved changes
function hasUnsavedChanges() {
    const currentConfig = getFormData();
    return JSON.stringify(currentConfig) !== JSON.stringify(originalConfig);
}

// Warn user about unsaved changes when leaving page
window.addEventListener('beforeunload', function (e) {
    if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
    }
});

function getFormData() {
    const formData = new FormData(document.getElementById('configForm'));
    const config = {};
    
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('web.')) {
            if (!config.web) config.web = {};
            const webKey = key.replace('web.', '');
            config.web[webKey] = value;
        } else {
            if (value === 'true') {
                config[key] = true;
            } else if (value === 'false') {
                config[key] = false;
            } else if (!isNaN(value) && value !== '') {
                config[key] = Number(value);
            } else {
                config[key] = value;
            }
        }
    }
    
    return config;
}
