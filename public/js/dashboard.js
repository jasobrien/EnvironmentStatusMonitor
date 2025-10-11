async function fetchConfig() {
    try {
        const response = await fetch("/config");
        const data = await response.json();
        console.log(data);
        return data;
    } catch (err) {
        console.log(err);
    }
}

const pageConfig = fetchConfig();

function setTitle(data) {
    const title = document.getElementById("pageTitle");
    title.innerHTML = data.page_title;
}

pageConfig.then(setTitle).catch(console.log);

function updateUpTimeStats(data, ElementID, Duration) {
    const uptime = (data.Green / data.Total) * 100;
    const element = document.getElementById(ElementID);
    element.innerHTML = !isNaN(uptime) ? `${Duration} Days: ${uptime.toFixed(2)} %` : "N/A";
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
        const response = await fetch(`/results/${environment}`);
        const data = await response.json();
        console.log(data);

        const testnames = data.map(index => index.key);
        const testresults = data.map(index => index.value);
        const dateTime = data.map(index => index.DateTime);

        // Store data for merged chart
        environmentData[environment].features = testnames;
        environmentData[environment].colors = testresults;
        environmentData[environment].lastUpdated = dateTime[0];

        // Fetch uptime data for each feature
        const uptimePromises = [1, 7, 30].map(days => 
            fetchUptimeStats(environment, days)
        );
        
        const uptimeResults = await Promise.all(uptimePromises);
        environmentData[environment].uptimeData = testnames.map((_, idx) => ({
            day1: uptimeResults[0] ? ((uptimeResults[0].Green / uptimeResults[0].Total) * 100).toFixed(2) : 'N/A',
            day7: uptimeResults[1] ? ((uptimeResults[1].Green / uptimeResults[1].Total) * 100).toFixed(2) : 'N/A',
            day30: uptimeResults[2] ? ((uptimeResults[2].Green / uptimeResults[2].Total) * 100).toFixed(2) : 'N/A'
        }));

    } catch (err) {
        console.log(err);
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
    
    console.log('Initializing ring charts...');

    const charts = {};
    
    // Create individual charts for each environment as rings
    const envConfigs = [
        { id: 'stagingChart', env: 'staging', cutout: '70%', radius: '100%', label: 'Staging' },
        { id: 'testChart', env: 'test', cutout: '40%', radius: '70%', label: 'Test' },
        { id: 'devChart', env: 'dev', cutout: '0%', radius: '40%', label: 'Development' }
    ];

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
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: config.cutout,
                    radius: config.radius,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false // Disable default tooltips, we'll handle them manually
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

const mergedCharts = initializeMergedChart();
console.log('Charts initialized:', mergedCharts);

if (!mergedCharts) {
    console.error('Failed to initialize charts!');
    // Show error message on page
    document.addEventListener('DOMContentLoaded', function() {
        const container = document.querySelector('.col-12.col-md-8 div');
        if (container) {
            container.style.display = 'none';
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = '<p style="color: red; text-align: center;">Error: Charts failed to initialize. Check console for details.</p>';
            container.parentNode.appendChild(errorDiv);
        }
    });
}
const environments = ["dev", "test", "staging"];
const environmentLabels = {
    dev: "Development",
    test: "Test",
    staging: "Staging"
};

// Store environment data
const environmentData = {
    dev: { features: [], colors: [], uptimeData: [], lastUpdated: null },
    test: { features: [], colors: [], uptimeData: [], lastUpdated: null },
    staging: { features: [], colors: [], uptimeData: [], lastUpdated: null }
};

// Fetch uptime stats for 1 day display
environments.forEach(env => {
    fetchUptimeStats(env, 1).then(data => updateUpTimeStats(data, `${env.charAt(0).toUpperCase() + env.slice(1)}EnvUptime1`, 1)).catch(console.log);
});

// Fetch and populate merged chart
Promise.all(environments.map(env => fetchStatus(env, null, null)))
    .then(() => {
        console.log('All environments fetched, environment data:', environmentData);
        updateMergedChart();
    })
    .catch(err => {
        console.error('Error fetching environment data:', err);
        // Show error on page
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.innerHTML = `Error loading data: ${err.message}`;
            lastUpdatedElement.style.color = 'red';
        }
    });

function updateFeatureLabels(featureLabels) {
    const container = document.getElementById('featureLabelsContainer');
    if (!container) return;
    
    // Clear existing labels
    container.innerHTML = '';
    
    if (featureLabels.length === 0) return;
    
    const containerRect = container.getBoundingClientRect();
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;
    const radius = Math.min(centerX, centerY) * 0.85; // Position labels between chart and edge
    
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
