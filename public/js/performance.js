const path = window.location.pathname;
const currentPath = path.split("/");
const lastTwoParts = currentPath.slice(-2);
const [environmentName, days] = lastTwoParts;

console.log(currentPath);
console.log(lastTwoParts);

const URLKeys = `/histresultskeys/${environmentName}`;
console.log("URLKeys are: " + URLKeys);

const apiUrl = `/histresultsdays/${environmentName}/${days}`;
console.log("apiUrl are: " + apiUrl);

// Fetch data from API
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const jsonData = await response.json();
    return jsonData;
  } catch (err) {
    console.error("Failed to fetch data:", err);
  }
}

async function createCharts() {
  const chartContainer = document.getElementById("chart-container");

  const transactions = await fetchData(URLKeys);

  for (const value of transactions) {
    const url = `/histresultsdays/${environmentName}/${value}/${days}`;
    const mydata = await fetchData(url);
    console.log(`Response for ${value}: `, mydata);

    const chartCard = document.createElement("div");
    chartCard.classList.add("col-md-4");

    const card = document.createElement("div");
    card.classList.add("card");

    const cardHeader = document.createElement("div");
    cardHeader.classList.add("card-header", "text-center");
    cardHeader.innerHTML = value;
    card.appendChild(cardHeader);

    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body");

    const canvas = document.createElement("canvas");
    const chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: mydata.map((d) => d.DateTime),
        datasets: [{
          label: mydata[0].key,
          data: mydata.map((d) => d.AvgResponseTime),
          fill: false,
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          tension: 0.1,
        }],
      },
      options: {
        scales: {
          x: {
            type: "time",
            distribution: "series",
            bounds: "data",
            time: {
              parser: "YYYY-MM-DD HH:mm:ss",
              displayFormats: {
                millisecond: "MMM DD",
                second: "MMM DD",
                minute: "MMM DD",
                hour: "MMM DD",
                day: "MMM DD",
                week: "MMM DD",
                month: "MMM DD",
                quarter: "MMM DD",
                year: "MMM DD",
              },
            },
          },
          y: {
            label: "Avg Response Time (ms)",
          },
        },
        plugins: {},
      },
    });

    cardBody.appendChild(canvas);
    card.appendChild(cardBody);
    chartCard.appendChild(card);
    chartContainer.appendChild(chartCard);
  }
}

createCharts();