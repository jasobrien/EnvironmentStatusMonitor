exports.config = {
  web: {
    page_title: "App Feature Status",
    refresh: "90",
    animation: "true",
    Env1Name: "Dev",
    Env2Name: "Test",
    Env3Name: "Staging",
    email: "EnvironmentStatusmMnitor@gmail.com"
  },
  Influx: false,
  ExtendedLog :false,
  session: false,
  user: "admin",
  password: "password",
  ENV1: "dev",
  ENV2: "test",
  ENV3: "staging",
  //dashboard colour % thresholds
  Green: 100,
  Amber: 90,
    //cron scheduler
  Every5: "0 */5 * * * *'",
  Every15: "'0 */15 * * * *'",
  Every30: "'0 */30 * * * *'",
  Every60: "'0 * * * *'",
  everyMinute: "0 */1 * * * *",
  every10Minutes: "0 */10 * * * *",
  everyhour: "0 * * * *",
  every6hours: "0 */6 * * *",
  every12hours: "0 */12 * * *",
  Customtime1: "",
  Customtime2: "",
  Customtime3: "",
  CronLocation: "Australia/Sydney",
  //Folders
  ResultsFolder: "./results/",
  PostmanCollectionFolder: "./collections/",
  PostmanEnvFolder: "./environments/",
  PostmanDataFolder: "./datafiles/",
  resultsFolder: "./results/",
  //Files
  HistoryFilePrefix: "hist_",
  ResultFileSuffix: "results"
};
