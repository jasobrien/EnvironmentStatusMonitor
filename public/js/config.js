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
    fetch('/api/config')
        .then(response => response.json())
        .then(config => {
            // Web configuration
            document.getElementById('pageTitle').value = config.web?.page_title || '';
            document.getElementById('refreshInterval').value = config.web?.refresh || '';
            document.getElementById('email').value = config.web?.email || '';
            document.getElementById('animation').value = config.web?.animation || 'true';

            // Load environments
            loadEnvironments(config.environments || []);

            // System configuration
            document.getElementById('greenThreshold').value = config.Green || '';
            document.getElementById('amberThreshold').value = config.Amber || '';

            // Authentication
            document.getElementById('user').value = config.user || '';
            document.getElementById('password').value = config.password || '';
            document.getElementById('session').checked = config.session || false;

            // Features
            document.getElementById('influx').checked = config.Influx || false;
            document.getElementById('extendedLog').checked = config.ExtendedLog || false;

            showAlert('Configuration loaded successfully!', 'success');
        })
        .catch(error => {
            console.error('Error loading configuration:', error);
            showAlert('Error loading configuration!', 'danger');
        });
}

function loadEnvironments(environments) {
    const container = document.getElementById('environmentsContainer');
    container.innerHTML = '';
    
    if (environments.length === 0) {
        // Add default environments if none exist
        environments = [
            { id: "dev", name: "Dev", displayName: "Development" },
            { id: "test", name: "Test", displayName: "Test" },
            { id: "staging", name: "Staging", displayName: "Staging" }
        ];
    }
    
    environments.forEach((env, index) => {
        addEnvironmentRow(env, index);
    });
}

function addEnvironmentRow(env = {}, index = null) {
    const container = document.getElementById('environmentsContainer');
    const envIndex = index !== null ? index : container.children.length;
    
    const envDiv = document.createElement('div');
    envDiv.className = 'card mb-3 environment-config';
    envDiv.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Environment ${envIndex + 1}</h6>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeEnvironment(${envIndex})">Remove</button>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Environment ID</label>
                        <input type="text" class="form-control" name="environments[${envIndex}].id" value="${env.id || ''}" placeholder="dev" required>
                        <small class="form-text text-muted">Unique identifier used in URLs and file names</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Short Name</label>
                        <input type="text" class="form-control" name="environments[${envIndex}].name" value="${env.name || ''}" placeholder="Dev" required>
                        <small class="form-text text-muted">Brief label for UI elements</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Display Name</label>
                        <input type="text" class="form-control" name="environments[${envIndex}].displayName" value="${env.displayName || ''}" placeholder="Development">
                        <small class="form-text text-muted">Full name shown in dashboard</small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(envDiv);
    return envDiv;
}

function addEnvironment() {
    addEnvironmentRow();
}

function removeEnvironment(index) {
    const container = document.getElementById('environmentsContainer');
    const envElements = container.querySelectorAll('.environment-config');
    if (envElements[index] && envElements.length > 1) {
        envElements[index].remove();
        // Re-index remaining environments
        reindexEnvironments();
    } else if (envElements.length === 1) {
        showAlert('At least one environment must be configured!', 'warning');
    }
}

function reindexEnvironments() {
    const container = document.getElementById('environmentsContainer');
    const envElements = container.querySelectorAll('.environment-config');
    
    envElements.forEach((element, newIndex) => {
        // Update header
        const header = element.querySelector('.card-header h6');
        header.textContent = `Environment ${newIndex + 1}`;
        
        // Update remove button
        const removeBtn = element.querySelector('.btn-danger');
        removeBtn.setAttribute('onclick', `removeEnvironment(${newIndex})`);
        
        // Update input names
        const inputs = element.querySelectorAll('input[name^="environments"]');
        inputs.forEach(input => {
            const name = input.getAttribute('name');
            const newName = name.replace(/environments\[\d+\]/, `environments[${newIndex}]`);
            input.setAttribute('name', newName);
        });
    });
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
            } else if (key.startsWith('environments[')) {
                // Handle environment array
                if (!config.environments) config.environments = [];
                
                // Parse environment index and field
                const match = key.match(/environments\[(\d+)\]\.(.+)/);
                if (match) {
                    const envIndex = parseInt(match[1]);
                    const fieldName = match[2];
                    
                    // Ensure environment object exists
                    if (!config.environments[envIndex]) {
                        config.environments[envIndex] = {};
                    }
                    
                    config.environments[envIndex][fieldName] = value;
                }
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
        
        // Update legacy environment properties for backward compatibility
        if (config.environments && config.environments.length > 0) {
            config.ENV1 = config.environments[0]?.id || 'dev';
            config.ENV2 = config.environments[1]?.id || 'test';
            config.ENV3 = config.environments[2]?.id || 'staging';
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
