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
        const AvgResponseTime = data.map(index => index.AvgResponseTime);
        const dateTime = data.map(index => index.DateTime);

        const lmd = document.getElementById(lmdId);
        if (lmd) {
            lmd.innerHTML = `Last Updated : ${dateTime[0]}`;
        }

        const size = AvgResponseTime.length;
        const filledArray = Array(size).fill(1);

        chart.config.data.labels = testnames;
        chart.config.data.datasets[0].backgroundColor = testresults;
        chart.config.data.datasets[0].data = filledArray;
        chart.config.data.datasets[0].borderWidth = 3;
        chart.update();
    } catch (err) {
        console.log(err);
    }
}

function refreshPage() {
    location.reload();
}

function initializeChart(ctxId) {
    const ctx = document.getElementById(ctxId);
    Chart.register(ChartDataLabels);
    Chart.defaults.set("plugins.datalabels", { color: "black" });

    return new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: [],
            datasets: [{
                label: "",
                data: [],
                backgroundColor: ["black", "black", "black", "black", "black"],
                borderColor: [],
                borderWidth: 3,
            }],
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                datalabels: {
                    formatter: (value, context) => context.chart.data.labels[context.dataIndex],
                },
            },
        },
    });
}

const charts = {
    dev: initializeChart("myChart"),
    test: initializeChart("testChart"),
    staging: initializeChart("stagingChart")
};

const environments = ["dev", "test", "staging"];
const durations = [1, 7, 30];

environments.forEach(env => {
    fetchStats(env).then(data => updateUpTimeStats(data, `${env.charAt(0).toUpperCase() + env.slice(1)}EnvUptime`, "All")).catch(console.log);
    durations.forEach(days => {
        fetchUptimeStats(env, days).then(data => updateUpTimeStats(data, `${env.charAt(0).toUpperCase() + env.slice(1)}EnvUptime${days}`, days)).catch(console.log);
    });
    fetchStatus(env, charts[env], `${env}lmd`);
});
