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
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    return jsonData;
  } catch (err) {
    console.error("Failed to fetch data:", err);
    return null;
  }
}

async function createCharts() {
  const chartContainer = document.getElementById("chart-container");

  // Fetch transaction keys
  const transactions = await fetchData(URLKeys);
  if (!transactions || transactions.length === 0) {
    console.error("No transactions found or failed to fetch transaction keys.");
    chartContainer.innerHTML = "<p>No data available to display charts.</p>";
    return;
  }

  for (const value of transactions) {
    const url = `/histresultsdays/${environmentName}/${value}/${days}`;
    const mydata = await fetchData(url);

    if (!mydata || mydata.length === 0) {
      console.warn(`No data found for transaction: ${value}`);
      continue;
    }

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
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
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
                day: "MMM DD",
              },
            },
          },
          y: {
            title: {
              display: true,
              text: "Avg Response Time (ms)",
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
        },
      },
    });

    cardBody.appendChild(canvas);
    card.appendChild(cardBody);
    chartCard.appendChild(card);
    chartContainer.appendChild(chartCard);
  }
}

document.addEventListener("DOMContentLoaded", createCharts);