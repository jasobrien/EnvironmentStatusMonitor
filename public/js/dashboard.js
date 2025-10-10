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
    // Get all unique feature names across all environments
    const allFeatures = new Set();
    environments.forEach(env => {
        environmentData[env].features.forEach(feature => allFeatures.add(feature));
    });
    const featureLabels = Array.from(allFeatures);

    // Update chart labels
    mergedChart.data.labels = featureLabels;

    // Create datasets for each environment
    const datasets = environments.map((env, envIdx) => {
        const envData = environmentData[env];
        const dataValues = [];
        const backgroundColors = [];
        const uptimeData = [];

        featureLabels.forEach(feature => {
            const featureIdx = envData.features.indexOf(feature);
            if (featureIdx !== -1) {
                dataValues.push(1);
                backgroundColors.push(envData.colors[featureIdx]);
                uptimeData.push(envData.uptimeData[featureIdx]);
            } else {
                dataValues.push(0);
                backgroundColors.push('rgba(200, 200, 200, 0.3)');
                uptimeData.push({ day1: 'N/A', day7: 'N/A', day30: 'N/A' });
            }
        });

        return {
            label: environmentLabels[env],
            data: dataValues,
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: 'white',
            uptimeData: uptimeData
        };
    });

    mergedChart.data.datasets = datasets;
    mergedChart.update();

    // Update last updated timestamp
    const latestUpdate = environments
        .map(env => environmentData[env].lastUpdated)
        .filter(date => date)
        .sort()
        .pop();
    
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement && latestUpdate) {
        lastUpdatedElement.innerHTML = `Last Updated: ${latestUpdate}`;
    }
}

function refreshPage() {
    location.reload();
}

function initializeMergedChart() {
    const ctx = document.getElementById("mergedChart");
    Chart.register(ChartDataLabels);

    return new Chart(ctx, {
        type: "polarArea",
        data: {
            labels: [],
            datasets: []
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                },
                datalabels: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const envName = context.dataset.label;
                            const featureName = context.label;
                            const uptimeData = context.dataset.uptimeData?.[context.dataIndex];
                            
                            let tooltipLines = [`Environment: ${envName}`];
                            if (uptimeData) {
                                tooltipLines.push(`1 Day Uptime: ${uptimeData.day1}%`);
                                tooltipLines.push(`7 Day Uptime: ${uptimeData.day7}%`);
                                tooltipLines.push(`30 Day Uptime: ${uptimeData.day30}%`);
                            }
                            return tooltipLines;
                        }
                    }
                }
            }
        }
    });
}

const mergedChart = initializeMergedChart();
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
        updateMergedChart();
    })
    .catch(console.log);
