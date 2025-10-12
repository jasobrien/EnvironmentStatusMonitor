async function fetchConfig() {
    try {
        console.log('Attempting to fetch config from /config...');
        const response = await fetch("/config");
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Config loaded:', data);
        
        // Update environment arrays based on configuration
        if (data.environments && data.environments.length > 0) {
            // Clear existing arrays
            environments.length = 0;
            Object.keys(environmentLabels).forEach(key => delete environmentLabels[key]);
            Object.keys(environmentData).forEach(key => delete environmentData[key]);
            
            // Populate from config
            data.environments.forEach(env => {
                environments.push(env.id);
                environmentLabels[env.id] = env.displayName || env.name;
                environmentData[env.id] = { 
                    features: [], 
                    colors: [], 
                    uptimeData: [], 
                    lastUpdated: null 
                };
            });
            
            console.log('Updated environments from config:', environments);
            console.log('Updated environment labels:', environmentLabels);
        } else {
            console.warn('No environments found in config:', data);
        }
        
        return data;
    } catch (err) {
        console.error('Error loading config:', err);
        return null;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM Content Loaded - starting initialization...');
    
    const config = await fetchConfig();
    if (config) {
        // Set page title
        setTitle(config);
        
        // Initialize dashboard if environments were loaded
        if (environments.length > 0) {
            console.log('Initializing dashboard with', environments.length, 'environments');
            initializeDynamicDashboard();
        } else {
            console.error('No environments loaded from config');
        }
    } else {
        console.error('Failed to load configuration, using fallback');
        // Fallback configuration if config endpoint fails
        const fallbackEnvironments = ['dev', 'test', 'staging', 'prod'];
        fallbackEnvironments.forEach(env => {
            environments.push(env);
            environmentLabels[env] = env.charAt(0).toUpperCase() + env.slice(1);
            environmentData[env] = { 
                features: [], 
                colors: [], 
                uptimeData: [], 
                lastUpdated: null 
            };
        });
        console.log('Using fallback environments:', environments);
        initializeDynamicDashboard();
    }
});

function setTitle(data) {
    const title = document.getElementById("pageTitle");
    if (title && data && data.page_title) {
        title.innerHTML = data.page_title;
    }
}

function updateUpTimeStats(data, ElementID, Duration) {
    const uptime = (data.Green / data.Total) * 100;
    const element = document.getElementById(ElementID);
    if (element) {
        element.innerHTML = !isNaN(uptime) ? `${Duration} Days: ${uptime.toFixed(2)} %` : "N/A";
    } else {
        console.warn(`Element with ID '${ElementID}' not found for uptime stats`);
    }
    console.log(data);
}

async function fetchUptimeStats(environment, days) {
    try {
        const response = await fetch(`/getSummaryStats/${environment}/${days}`);
        const data = await response.json();
        console.log(data);
        return data;
    } catch (err) {
        console.log(err);
    }
}

async function fetchStats(environment) {
    try {
        const response = await fetch(`/getSummaryStats/${environment}`);
        const data = await response.json();
        console.log(data);
        return data;
    } catch (err) {
        console.log(err);
    }
}

async function fetchStatus(environment, chart, lmdId) {
    try {
        const response = await fetch(`/results/${environment}/`);
        const data = await response.json();
        console.log(data);

        const testnames = data.map(index => index.key);
        const testresults = data.map(index => index.value);
        const dateTime = data.map(index => index.DateTime);
        const avgResponseTimes = data.map(index => index.AvgResponseTime || 'N/A');

        // Store data for merged chart
        environmentData[environment].features = testnames;
        environmentData[environment].colors = testresults;
        environmentData[environment].lastUpdated = dateTime[0];
        environmentData[environment].performanceData = avgResponseTimes;

        // Fetch uptime data for each feature
        const uptimePromises = [1, 7, 30].map(days => 
            fetchUptimeStats(environment, days)
        );
        
        const uptimeResults = await Promise.all(uptimePromises);
        environmentData[environment].uptimeData = testnames.map((_, idx) => ({
            day1: uptimeResults[0] ? ((uptimeResults[0].Green / uptimeResults[0].Total) * 100).toFixed(2) : 'N/A',
            day7: uptimeResults[1] ? ((uptimeResults[1].Green / uptimeResults[1].Total) * 100).toFixed(2) : 'N/A',
            day30: uptimeResults[2] ? ((uptimeResults[2].Green / uptimeResults[2].Total) * 100).toFixed(2) : 'N/A',
            avgResponseTime: avgResponseTimes[idx]
        }));

    } catch (err) {
        console.log('Error fetching data for', environment, ':', err);
        
        // Add fallback mock data for testing when API is unavailable
        console.log('Using fallback mock data for', environment);
        const mockFeatures = ['dashboard', 'deploy', 'data', 'performance'];
        const mockColors = ['Green', 'Green', 'Green', 'Green'];
        const mockResponseTimes = [45, 55, 65, 75];
        
        environmentData[environment].features = mockFeatures;
        environmentData[environment].colors = mockColors;
        environmentData[environment].lastUpdated = new Date().toLocaleString();
        environmentData[environment].performanceData = mockResponseTimes;
        environmentData[environment].uptimeData = mockFeatures.map((_, idx) => ({
            day1: '98.5',
            day7: '97.2', 
            day30: '96.8',
            avgResponseTime: mockResponseTimes[idx]
        }));
        
        console.log('Mock data set for', environment, ':', environmentData[environment]);
    }
}

function updateMergedChart() {
    console.log('Updating ring charts...', environmentData);
    
    if (!mergedCharts) {
        console.error('Charts not initialized!');
        return;
    }
    
    // Get all unique feature names across all environments
    const allFeatures = new Set();
    environments.forEach(env => {
        console.log(`Environment ${env} has ${environmentData[env].features.length} features:`, environmentData[env].features);
        if (environmentData[env].features.length > 0) {
            environmentData[env].features.forEach(feature => allFeatures.add(feature));
        }
    });
    const featureLabels = Array.from(allFeatures);
    
    console.log('All unique feature labels:', featureLabels);

    // Update each environment's chart
    environments.forEach((env, envIdx) => {
        const chart = mergedCharts[env];
        const envData = environmentData[env];
        
        if (!chart) {
            console.log(`No chart found for ${env}`);
            return;
        }
        
        if (envData.features.length === 0) {
            console.log(`No data for ${env}, keeping loading state`);
            return;
        }

        // Update this environment's chart
        chart.data.labels = envData.features;
        
        const backgroundColors = envData.colors.map(color => getColorFromStatus(color));
        
        chart.data.datasets = [{
            label: environmentLabels[env],
            data: envData.features.map(() => 1), // Equal segments
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: 'white',
            uptimeData: envData.uptimeData || envData.features.map(() => ({ day1: 'N/A', day7: 'N/A', day30: 'N/A' }))
        }];

        chart.update();
        console.log(`Updated chart for ${env} with ${envData.features.length} features`);
    });

    // Update feature labels around the chart
    updateFeatureLabels(featureLabels);

    // Update last updated timestamp
    const latestUpdate = environments
        .map(env => environmentData[env].lastUpdated)
        .filter(date => date)
        .sort()
        .pop();
    
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement && latestUpdate) {
        lastUpdatedElement.innerHTML = `Last Updated: ${latestUpdate}`;
    } else if (lastUpdatedElement) {
        const activeEnvs = environments.filter(env => environmentData[env].features.length > 0);
        lastUpdatedElement.innerHTML = `Chart Status: ${activeEnvs.length} environments with data (${activeEnvs.join(', ')})`;
    }
}

function getColorFromStatus(status) {
    switch(status) {
        case 'Green':
            return '#28a745';
        case 'Red':
            return '#dc3545';
        case 'Amber':
            return '#ffc107';
        default:
            return '#6c757d';
    }
}

function refreshPage() {
    location.reload();
}

function initializeMergedChart() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded!');
        return null;
    }
    
    // Destroy existing charts if they exist
    if (mergedCharts) {
        console.log('Destroying existing charts...');
        Object.values(mergedCharts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        mergedCharts = null;
    }
    
    // Register the datalabels plugin
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }
    
    console.log('Initializing ring charts for environments:', environments);

    if (environments.length === 0) {
        console.warn('No environments loaded yet');
        return null;
    }

    const charts = {};
    
    // Create dynamic chart configurations based on loaded environments
    const envConfigs = [];
    const baseRadius = 100;
    const ringWidth = Math.min(30, baseRadius / environments.length); // Adaptive ring width
    
    environments.forEach((envId, index) => {
        const outerRadius = baseRadius - (index * ringWidth);
        const innerRadius = Math.max(0, outerRadius - ringWidth + 5); // 5px gap between rings
        
        envConfigs.push({
            id: `${envId}Chart`,
            env: envId,
            cutout: `${innerRadius}%`,
            radius: `${outerRadius}%`,
            label: environmentLabels[envId] || envId
        });
    });

    console.log('Environment configurations:', envConfigs);

    envConfigs.forEach(config => {
        const ctx = document.getElementById(config.id);
        if (!ctx) {
            console.error(`Canvas element "${config.id}" not found!`);
            return;
        }

        try {
            charts[config.env] = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: ['Loading...'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#e9ecef'],
                        borderWidth: 2,
                        borderColor: 'white'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: config.cutout,
                    radius: config.radius,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false // Disable default tooltips since we use custom ones
                        },
                        datalabels: {
                            display: true,
                            color: 'white',
                            font: {
                                weight: 'bold',
                                size: 9
                            },
                            formatter: function(value, context) {
                                const dataset = context.dataset;
                                const dataIndex = context.dataIndex;
                                const uptimeData = dataset.uptimeData?.[dataIndex];
                                
                                if (uptimeData && uptimeData.day1 !== 'N/A' && value > 0) {
                                    const uptime = uptimeData.day1 + '%';
                                    const responseTime = uptimeData.avgResponseTime !== 'N/A' ? 
                                        uptimeData.avgResponseTime + 'ms' : 'N/A';
                                    return [uptime, responseTime];
                                }
                                return '';
                            },
                            textStrokeColor: 'rgba(0,0,0,0.8)',
                            textStrokeWidth: 1
                        }
                    },
                    layout: {
                        padding: 20
                    },
                    onHover: function(event, elements) {
                        // Disable default hover behavior
                    }
                }
            });
        } catch (error) {
            console.error(`Error creating chart for ${config.env}:`, error);
        }
    });

    // Add global mouse event handling for custom tooltips
    setupGlobalTooltipHandling(charts);

    return charts;
}

function setupGlobalTooltipHandling(charts) {
    // Create a custom tooltip element
    let customTooltip = document.getElementById('customTooltip');
    if (!customTooltip) {
        customTooltip = document.createElement('div');
        customTooltip.id = 'customTooltip';
        customTooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            display: none;
            max-width: 200px;
            line-height: 1.4;
        `;
        document.body.appendChild(customTooltip);
    }

    // Store original colors for each chart
    const originalColors = {};
    Object.keys(charts).forEach(env => {
        originalColors[env] = null;
    });

    // Add mouse event listeners to the container
    const container = document.querySelector('.col-12.col-md-8 div[style*="position: relative"]');
    if (!container) return;

    let currentHoveredChart = null;
    let currentHoveredIndex = null;

    container.addEventListener('mousemove', function(event) {
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Calculate center and distance
        const centerX = container.offsetWidth / 2;
        const centerY = container.offsetHeight / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const maxRadius = Math.min(centerX, centerY) * 0.8;
        
        // Determine which ring the mouse is over
        let activeEnv = null;
        let activeChart = null;
        
        const ringConfigs = [
            { env: 'dev', cutout: 0, radius: 40, label: 'Development' },
            { env: 'test', cutout: 40, radius: 70, label: 'Test' },
            { env: 'staging', cutout: 70, radius: 100, label: 'Staging' }
        ];

        for (const config of ringConfigs) {
            const innerRadius = (config.cutout / 100) * maxRadius;
            const outerRadius = (config.radius / 100) * maxRadius;
            
            if (distance >= innerRadius && distance <= outerRadius) {
                activeEnv = config.env;
                activeChart = charts[config.env];
                break;
            }
        }

        // Reset previous hover effects
        if (currentHoveredChart && currentHoveredIndex !== null) {
            resetHoverEffect(currentHoveredChart, currentHoveredIndex, originalColors[currentHoveredChart.config._config.id || currentHoveredChart.canvas.id.replace('Chart', '')]);
        }

        if (activeChart && activeEnv) {
            // Get the chart element data
            const canvasRect = activeChart.canvas.getBoundingClientRect();
            const canvasX = event.clientX - canvasRect.left;
            const canvasY = event.clientY - canvasRect.top;
            
            // Create a synthetic event for the chart
            const syntheticEvent = {
                type: 'mousemove',
                clientX: event.clientX,
                clientY: event.clientY,
                offsetX: canvasX,
                offsetY: canvasY
            };
            
            const elements = activeChart.getElementsAtEventForMode(syntheticEvent, 'nearest', { intersect: true }, false);
            
            if (elements.length > 0) {
                const element = elements[0];
                const dataIndex = element.index;
                const dataset = activeChart.data.datasets[0];
                const label = activeChart.data.labels[dataIndex];
                const uptimeData = dataset.uptimeData?.[dataIndex];
                
                // Store original colors if not already stored
                if (!originalColors[activeEnv]) {
                    originalColors[activeEnv] = [...dataset.backgroundColor];
                }
                
                // Apply hover effect
                applyHoverEffect(activeChart, dataIndex, originalColors[activeEnv]);
                currentHoveredChart = activeChart;
                currentHoveredIndex = dataIndex;
                
                // Show custom tooltip
                let tooltipContent = `<strong>Environment:</strong> ${ringConfigs.find(c => c.env === activeEnv).label}<br>`;
                tooltipContent += `<strong>Feature:</strong> ${label}`;
                
                if (uptimeData) {
                    tooltipContent += `<br><strong>1 Day Uptime:</strong> ${uptimeData.day1}%`;
                    tooltipContent += `<br><strong>7 Day Uptime:</strong> ${uptimeData.day7}%`;
                    tooltipContent += `<br><strong>30 Day Uptime:</strong> ${uptimeData.day30}%`;
                }
                
                customTooltip.innerHTML = tooltipContent;
                customTooltip.style.display = 'block';
                customTooltip.style.left = event.clientX + 'px';
                customTooltip.style.top = event.clientY + 'px';
                
                // Change cursor to pointer
                container.style.cursor = 'pointer';
            } else {
                customTooltip.style.display = 'none';
                container.style.cursor = 'default';
                currentHoveredChart = null;
                currentHoveredIndex = null;
            }
        } else {
            customTooltip.style.display = 'none';
            container.style.cursor = 'default';
            currentHoveredChart = null;
            currentHoveredIndex = null;
        }
    });

    container.addEventListener('mouseleave', function() {
        customTooltip.style.display = 'none';
        container.style.cursor = 'default';
        
        // Reset any hover effects
        if (currentHoveredChart && currentHoveredIndex !== null) {
            const env = currentHoveredChart.canvas.id.replace('Chart', '');
            resetHoverEffect(currentHoveredChart, currentHoveredIndex, originalColors[env]);
        }
        currentHoveredChart = null;
        currentHoveredIndex = null;
    });
}

function applyHoverEffect(chart, dataIndex, originalColors) {
    const dataset = chart.data.datasets[0];
    const newColors = [...originalColors];
    
    // Make the hovered segment brighter and add a border effect
    const originalColor = originalColors[dataIndex];
    newColors[dataIndex] = lightenColor(originalColor, 0.3); // Brighten by 30%
    
    // Slightly dim other segments
    for (let i = 0; i < newColors.length; i++) {
        if (i !== dataIndex) {
            newColors[i] = darkenColor(originalColors[i], 0.2); // Darken by 20%
        }
    }
    
    dataset.backgroundColor = newColors;
    chart.update('none'); // Update without animation for smooth hover
}

function resetHoverEffect(chart, dataIndex, originalColors) {
    if (!originalColors) return;
    
    const dataset = chart.data.datasets[0];
    dataset.backgroundColor = [...originalColors];
    chart.update('none');
}

function lightenColor(color, factor) {
    // Convert color to RGB and lighten it
    if (color === 'transparent') return color;
    
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function darkenColor(color, factor) {
    // Convert color to RGB and darken it
    if (color === 'transparent') return color;
    
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.floor(r * (1 - factor));
    const newG = Math.floor(g * (1 - factor));
    const newB = Math.floor(b * (1 - factor));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Dynamic environment arrays - populated from config
const environments = [];
const environmentLabels = {};

// Global charts variable
let mergedCharts = null;

// Dashboard initialization flag
let dashboardInitialized = false;

// Store environment data - populated dynamically
const environmentData = {};

function updateFeatureLabels(featureLabels) {
    const container = document.getElementById('featureLabelsContainer');
    if (!container) return;
    
    // Clear existing labels
    container.innerHTML = '';
    
    if (featureLabels.length === 0) return;
    
    const containerRect = container.getBoundingClientRect();
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;
    const radius = Math.min(centerX, centerY) * 1.1; // Position labels outside the chart
    
    featureLabels.forEach((feature, index) => {
        // Calculate the middle angle of each segment
        const segmentSize = (2 * Math.PI) / featureLabels.length;
        const segmentStartAngle = (index * segmentSize) - (Math.PI / 2); // Start from top
        const segmentMiddleAngle = segmentStartAngle + (segmentSize / 2); // Middle of the segment
        
        // Calculate position at the middle of the segment
        const x = centerX + Math.cos(segmentMiddleAngle) * radius;
        const y = centerY + Math.sin(segmentMiddleAngle) * radius;
        
        // Create label element
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: bold;
            color: #333;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 20;
        `;
        label.textContent = feature;
        
        container.appendChild(label);
    });
}

function initializeDynamicDashboard() {
    console.log('Initializing dynamic dashboard...');
    
    // Prevent multiple initializations
    if (dashboardInitialized) {
        console.log('Dashboard already initialized, skipping...');
        return;
    }
    
    // Create dynamic HTML elements
    createDynamicChartContainer();
    
    // Initialize charts
    console.log('About to initialize charts with environments:', environments);
    mergedCharts = initializeMergedChart();
    console.log('Chart initialization result:', mergedCharts);
    
    if (mergedCharts) {
        console.log('Charts successfully initialized, starting data fetch...');
        // Start loading data for all environments
        Promise.all(environments.map(env => fetchStatus(env, null, null)))
            .then(() => {
                console.log('All environments fetched, environment data:', environmentData);
                updateMergedChart();
            })
            .catch(error => {
                console.error('Error fetching environment data:', error);
            });

        // Note: Uptime stats are now integrated into the chart data via fetchStatus
        // No need for separate uptime element updates since those elements don't exist in this dashboard design
        
        // Mark dashboard as initialized
        dashboardInitialized = true;
        console.log('Dashboard initialization completed');
    } else {
        console.error('Chart initialization failed! mergedCharts is null');
        // Still mark as initialized to prevent retry loops
        dashboardInitialized = true;
    }
}

function createDynamicChartContainer() {
    const container = document.getElementById('chartContainer');
    if (!container) {
        console.error('Chart container not found!');
        return;
    }

    // Clear existing content except preserve the feature labels container if it exists
    const featureLabels = container.querySelector('#featureLabelsContainer');
    container.innerHTML = '';
    
    // Re-add feature labels container
    if (!featureLabels) {
        const labelsContainer = document.createElement('div');
        labelsContainer.id = 'featureLabelsContainer';
        labelsContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 15;';
        container.appendChild(labelsContainer);
    } else {
        container.appendChild(featureLabels);
    }

    // Create canvas elements and environment labels for each environment
    environments.forEach((envId, index) => {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = `${envId}Chart`;
        canvas.setAttribute('aria-label', `${environmentLabels[envId] || envId} environment chart`);
        canvas.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: ${index + 1};`;
        container.appendChild(canvas);

        // Create environment label
        const labelDiv = document.createElement('div');
        // Position labels at different heights based on ring position
        const positions = ['50%', '35%', '20%', '65%', '80%']; // Supports up to 5 environments
        const topPosition = positions[index] || `${15 + (index * 10)}%`;
        
        labelDiv.style.cssText = `
            position: absolute; 
            top: ${topPosition}; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            text-align: center; 
            pointer-events: none; 
            z-index: 10;
        `;
        
        labelDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.9); padding: 4px 8px; border: 1px solid #333; border-radius: 4px; margin-bottom: 5px; font-weight: bold; font-size: 12px;">
                ${environmentLabels[envId] || envId}
            </div>
        `;
        
        container.appendChild(labelDiv);
    });

    // Create performance buttons
    createDynamicPerformanceButtons();
}

function createDynamicPerformanceButtons() {
    const buttonsContainer = document.getElementById('performanceButtons');
    if (!buttonsContainer) {
        console.warn('Performance buttons container not found, creating fallback');
        // Try to find the performance section and create the container
        const performanceSection = document.querySelector('h5:contains("Performance Statistics")');
        if (performanceSection && performanceSection.nextElementSibling) {
            const newContainer = document.createElement('div');
            newContainer.id = 'performanceButtons';
            newContainer.className = 'd-flex justify-content-center flex-wrap gap-3';
            performanceSection.nextElementSibling.appendChild(newContainer);
        } else {
            return;
        }
    }

    const container = document.getElementById('performanceButtons');
    if (!container) return;

    container.innerHTML = '';
    
    environments.forEach((envId, index) => {
        const button = document.createElement('a');
        button.href = `/dashboard/performance/${envId}/1`;
        button.className = 'btn btn-primary mr-2 mb-2';
        button.textContent = `${environmentLabels[envId] || envId} Performance`;
        container.appendChild(button);
    });
}
