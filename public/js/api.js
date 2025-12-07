/**
 * Shared API utility functions for frontend
 * Provides consistent error handling and request patterns
 */

/**
 * Generic GET request with error handling
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
async function apiGet(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error [GET ${endpoint}]:`, error);
        throw error;
    }
}

/**
 * Generic POST request with error handling
 * @param {string} endpoint - API endpoint to call
 * @param {Object} data - Data to send
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
async function apiPost(endpoint, data, options = {}) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(data),
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error [POST ${endpoint}]:`, error);
        throw error;
    }
}

/**
 * Generic PUT request with error handling
 * @param {string} endpoint - API endpoint to call
 * @param {Object} data - Data to send
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response (may be text or JSON)
 */
async function apiPut(endpoint, data, options = {}) {
    try {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: typeof data === 'string' ? data : JSON.stringify(data),
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    } catch (error) {
        console.error(`API Error [PUT ${endpoint}]:`, error);
        throw error;
    }
}

/**
 * Fetch configuration from server
 * @returns {Promise<Object>} Configuration object
 */
async function fetchConfig() {
    try {
        console.log('Fetching config from /config...');
        const data = await apiGet('/config');
        console.log('Config loaded:', data);
        return data;
    } catch (error) {
        console.error('Error loading config:', error);
        return null;
    }
}

/**
 * Fetch results for a specific environment
 * @param {string} environment - Environment ID (dev, test, staging, prod)
 * @returns {Promise<Array>} Results array
 */
async function fetchResults(environment) {
    return await apiGet(`/results/${environment}/`);
}

/**
 * Fetch historical results for a specific key
 * @param {string} environment - Environment ID
 * @param {string} key - Result key/collection name
 * @param {number|string} days - Number of days or 'All'
 * @returns {Promise<Array>} Historical results
 */
async function fetchHistoricalResults(environment, key, days) {
    return await apiGet(`/histresults/${environment}/${key}/${days}`);
}

/**
 * Fetch historical results with days filter
 * @param {string} environment - Environment ID
 * @param {string} key - Result key/collection name
 * @param {number|string} days - Number of days or 'All'
 * @returns {Promise<Array>} Filtered historical results
 */
async function fetchHistoricalResultsDays(environment, key, days) {
    return await apiGet(`/histresultsdays/${environment}/${key}/${days}`);
}

/**
 * Fetch available result keys for an environment
 * @param {string} environment - Environment ID
 * @returns {Promise<Array>} Array of keys
 */
async function fetchResultKeys(environment) {
    return await apiGet(`/histresultskeys/${environment}`);
}

/**
 * Fetch summary statistics for an environment
 * @param {string} environment - Environment ID
 * @param {number} days - Optional number of days to filter
 * @returns {Promise<Object>} Statistics object
 */
async function fetchSummaryStats(environment, days = null) {
    const endpoint = days 
        ? `/getSummaryStats/${environment}/${days}`
        : `/getSummaryStats/${environment}`;
    return await apiGet(endpoint);
}

/**
 * Fetch statistics for a specific feature/key
 * @param {string} environment - Environment ID
 * @param {string} key - Feature/collection key
 * @returns {Promise<Object>} Statistics object
 */
async function fetchFeatureStats(environment, key) {
    return await apiGet(`/getStats/${environment}/${key}`);
}

/**
 * Fetch deployment readiness for an environment
 * @param {string} environment - Environment ID
 * @param {string} key - Optional specific collection key
 * @returns {Promise<Object|Array>} Deployment readiness data
 */
async function fetchDeploymentReadiness(environment, key = null) {
    const endpoint = key
        ? `/readyToDeploy/${environment}/${key}`
        : `/readyToDeploy/${environment}`;
    return await apiGet(endpoint);
}

/**
 * Trigger test run for an environment
 * @param {string} environmentName - Environment name (Dev, Test, Staging, Prod)
 * @returns {Promise<void>}
 */
async function runEnvironmentTests(environmentName) {
    try {
        const response = await fetch(`/run${environmentName}`);
        if (!response.ok) {
            throw new Error(`Failed to trigger tests: ${response.status}`);
        }
        console.log(`Tests triggered for ${environmentName}`);
    } catch (error) {
        console.error(`Error running ${environmentName} tests:`, error);
        throw error;
    }
}

/**
 * Update configuration
 * @param {Object} config - New configuration object
 * @returns {Promise<Object>} Updated configuration
 */
async function updateConfiguration(config) {
    return await apiPut('/api/config', config);
}

/**
 * Helper function to handle API errors with user feedback
 * @param {Error} error - Error object
 * @param {string} context - Context description for the error
 */
function handleApiError(error, context) {
    const message = `${context}: ${error.message}`;
    console.error(message);
    
    // You can customize this to show toasts, alerts, etc.
    if (typeof showNotification === 'function') {
        showNotification(message, 'error');
    }
}

/**
 * Retry a failed API call with exponential backoff
 * @param {Function} apiCall - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default 3)
 * @param {number} baseDelay - Base delay in ms (default 1000)
 * @returns {Promise<any>} Result from successful call
 */
async function retryApiCall(apiCall, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}
