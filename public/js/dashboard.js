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
    let titlecontent = data.page_title;
    let title = document.getElementById("pageTitle");
    title.innerHTML = titlecontent;
    //console.log(data);
  }

  fetchConfig()
    .then((data) => {
      setTitle(data);
    })
    .catch(function (err) {
      console.log(err);
    });


    function updateUpTimeStats(data,ElementID,Duration) {
    let uptime = (data.Green / data.Total) * 100;
    let element = document.getElementById(ElementID);
    if(!isNaN(uptime)) {
      element.innerHTML = Duration+ " Days: " + uptime.toFixed(2) + " %";
      }else{
      element.innerHTML = "N/A";
    }
    console.log(data);
  }


  async function fetchUptimeStats(environment, days) {
    try {
      const response = await fetch(
        "/getSummaryStats/" + environment + "/" + days
      );
      const data = await response.json();
      console.log(data);
      return data;
    } catch (err) {
      console.log(err);
    }
  }

  fetchUptimeStats("dev", 7)
    .then((data) => {
      updateUpTimeStats(data,"DevEnvUptime7","7");
    })
    .catch(function (err) {
      console.log(err);
    });

  fetchUptimeStats("dev", 1)
    .then((data) => {
      updateUpTimeStats(data,"DevEnvUptime1","1");
     // updateUpTimeDev1Day(data);
    })
    .catch(function (err) {
      console.log(err);
    });

  fetchUptimeStats("dev", 30)
    .then((data) => {
      updateUpTimeStats(data,"DevEnvUptime30","30");
    })
    .catch(function (err) {
      console.log(err);
    });

  async function fetchStats(environment) {
    try {
      const response = await fetch("/getSummaryStats/" + environment);
      const data = await response.json();
      console.log(data);
      return data;
    } catch (err) {
      console.log(err);
    }
  }

  fetchStats("dev")
    .then((data) => {
      updateUpTimeStats(data,"DevEnvUptime","All");
    })
    .catch(function (err) {
      console.log(err);
    });

  fetchStats("test")
    .then((data) => {
      updateUpTimeStats(data,"TestEnvUptime","All");
    })
    .catch(function (err) {
      console.log(err);
    });

  fetchUptimeStats("test", 7)
    .then((data) => {
      updateUpTimeStats(data,"TestEnvUptime7","7");
    })
    .catch(function (err) {
      console.log(err);
    });

    fetchUptimeStats("test", 30)
    .then((data) => {
      updateUpTimeStats(data,"TestEnvUptime30","30");
    })
    .catch(function (err) {
      console.log(err);
    });

  fetchUptimeStats("test", 1)
    .then((data) => {
      updateUpTimeStats(data,"TestEnvUptime1","1");
    })
    .catch(function (err) {
      console.log(err);
    });


  fetchStats("staging")
    .then((data) => {
      updateUpTimeStats(data,"StagingEnvUptime","All");
    })
    .catch(function (err) {
      console.log(err);
    });


  fetchUptimeStats("staging", 7)
    .then((data) => {
      updateUpTimeStats(data,"StagingEnvUptime7","7");
    })
    .catch(function (err) {
      console.log(err);
    });

  fetchUptimeStats("staging", 1)
    .then((data) => {
      updateUpTimeStats(data,"StagingEnvUptime1","1");
    })
    .catch(function (err) {
      console.log(err);
    });

  fetchUptimeStats("staging", 30)
    .then((data) => {
      updateUpTimeStats(data,"StagingEnvUptime30","30");
    })
    .catch(function (err) {
      console.log(err);
    });

  async function fetchDevStatus() {
    try {
      const response = await fetch("/results/dev");
      const data = await response.json();
      console.log(data);
      return data;
    } catch (err) {
      console.log(err);
    }
  }

  fetchDevStatus()
    .then((data) => {
      const testnames = data.map(function (index) {
        return index.key;
      });

      const testresults = data.map(function (index) {
        return index.value;
      });
      const AvgResponseTime = data.map(function (index) {
        return index.AvgResponseTime;
      });

      const dateTime = data.map(function (index) {
        return index.DateTime;
      });

      let lmd = document.getElementById("devlmd");
      lmd.innerHTML = "Last Updated : " + dateTime[0];
      //  console.log(testnames);
      //  console.log(testresults);
      let env = "AvgResponseTime";
      const size = AvgResponseTime.length;
      const filledArray = Array(size).fill(1);

      myChart.config.data.labels = testnames;
      myChart.config.data.datasets[0].backgroundColor = testresults;
      myChart.config.data.datasets[0].data = filledArray;
      //  myChart.config.data.datasets[0].label = env;
      myChart.config.data.datasets[0].borderWidth = 3;
      myChart.update();
    })
    .catch(function (err) {
      console.log(err);
    });

  async function fetchTestStatus() {
    try {
      const response = await fetch("/results/test");
      const data = await response.json();
      console.log(data);
      return data;
    } catch (err) {
      console.log(err);
    }
  }

  fetchTestStatus()
    .then((data) => {
      const testnames = data.map(function (index) {
        return index.key;
      });

      const testresults = data.map(function (index) {
        return index.value;
      });
      const AvgResponseTime = data.map(function (index) {
        return index.AvgResponseTime;
      });

      const dateTime = data.map(function (index) {
        return index.DateTime;
      });

      let lmd = document.getElementById("testlmd");
      lmd.innerHTML = "Last Updated : " + dateTime[0];

      console.log(testnames);
      console.log(testresults);
      let env = "AvgResponseTime";
      const size = AvgResponseTime.length;
      const filledArray = Array(size).fill(1);

      testChart.config.data.labels = testnames;
      testChart.config.data.datasets[0].backgroundColor = testresults;
      testChart.config.data.datasets[0].data = filledArray;
      //  testChart.config.data.datasets[0].label = AvgResponseTime;
      testChart.config.data.datasets[0].borderWidth = 3;
      testChart.update();
    })
    .catch(function (err) {
      console.log(err);
    });

  async function fetchStagingStatus() {
    try {
      const response = await fetch("/results/staging");
      const data = await response.json();
      console.log(data);
      return data;
    } catch (err) {
      console.log(err);
    }
  }

  fetchStagingStatus()
    .then((data) => {
      const testnames = data.map(function (index) {
        return index.key;
      });

      const testresults = data.map(function (index) {
        return index.value;
      });
      const AvgResponseTime = data.map(function (index) {
        return index.AvgResponseTime;
      });

      const dateTime = data.map(function (index) {
        return index.DateTime;
      });

      let lmd = document.getElementById("stagelmd");
      lmd.innerHTML = "Last Updated : " + dateTime[0];

      const size = AvgResponseTime.length;
      const filledArray = Array(size).fill(1);
      console.log(testnames);
      console.log(testresults);
      let env = "AvgResponseTime";
      const MyResponseTimeArray = [...AvgResponseTime];

      stagingChart.config.data.labels = testnames;
      stagingChart.config.data.datasets[0].backgroundColor = testresults;
      stagingChart.config.data.datasets[0].data = filledArray;
      // stagingChart.config.data.datasets[0].label= MyResponseTimeArray;
      stagingChart.config.data.datasets[0].borderWidth = 3;
      stagingChart.update();
    })
    .catch(function (err) {
      console.log(err);
    });



  function refreshPage() {
    location.reload();
  }

  let ctx = document.getElementById("myChart");
  Chart.register(ChartDataLabels);
  Chart.defaults.set("plugins.datalabels", {
    color: "black",
  });

  let myChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{
        label: "",
        data: [],
        backgroundColor: ["black", "black", "black", "black", "black"],
        borderColor: [],
        borderWidth: 3,
      }, ],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: true,
      plugins: {},
      plugins: {
        datalabels: {
          formatter: (value, context) => {
            console.log(
              "context" + context.chart.data.labels[context.dataIndex]
            );
            console.log(context);
            return context.chart.data.labels[context.dataIndex];
          },
        },
      },
    },
  });

  let ctxtest = document.getElementById("testChart");
  Chart.register(ChartDataLabels);
  let testChart = new Chart(ctxtest, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{
        label: "",
        data: [],
        backgroundColor: ["black", "black", "black", "black", "black"],
        borderColor: [],
        borderWidth: 3,
      }, ],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: true,
      plugins: {},
      plugins: {
        datalabels: {
          formatter: (value, context) => {
            console.log(
              "context  " + context.chart.data.labels[context.dataIndex]
            );
            console.log(context);
            return context.chart.data.labels[context.dataIndex];
          },
          tooltips: {
            enabled: false,
          },
        },
      },
    },
  });

  let ctxstaging = document.getElementById("stagingChart");
  Chart.register(ChartDataLabels);
  let stagingChart = new Chart(ctxstaging, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{
        label: "",
        datalabels: {
          labels: {},
        },
        data: [],
        backgroundColor: ["black", "black", "black", "black", "black"],
        borderColor: [],
        borderWidth: 3,
      }, ],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: true,
      plugins: {},
      plugins: {
        datalabels: {
          formatter: (value, context) => {
            console.log(
              "context" + context.chart.data.labels[context.dataIndex]
            );
            console.log(context);
            return context.chart.data.labels[context.dataIndex];
          },
        },
      },
    },
  });
