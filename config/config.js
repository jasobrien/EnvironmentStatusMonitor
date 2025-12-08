exports.config = {
  "web": {
    "page_title": "Test"
  },
  "environments": [
    {
      "id": "dev",
      "name": "Dev",
      "displayName": "Development"
    },
    {
      "id": "test",
      "name": "Test",
      "displayName": "Test"
    },
    {
      "id": "staging",
      "name": "Staging",
      "displayName": "Staging"
    },
    {
      "id": "prod",
      "name": "Prod",
      "displayName": "Production"
    },
    {
      "id": "qa",
      "name": "QA",
      "displayName": "Quality Assurance"
    }
  ],
  "Influx": false,
  "ExtendedLog": false,
  "session": false,
  "user": "admin",
  "password": "password",
  "Green": 100,
  "Amber": 90,
  "Every5": "0 */5 * * * *",
  "Every15": "0 */15 * * * *",
  "Every30": "0 */30 * * * *",
  "Every60": "0 * * * *",
  "everyMinute": "0 */1 * * * *",
  "every10Minutes": "0 */10 * * * *",
  "everyhour": "0 * * * *",
  "every6hours": "0 */6 * * *",
  "every12hours": "0 */12 * * *",
  "Customtime1": "",
  "Customtime2": "",
  "Customtime3": "",
  "CronLocation": "Australia/Sydney",
  "ResultsFolder": "./results/",
  "PostmanCollectionFolder": "./collections/",
  "PostmanEnvFolder": "./environments/",
  "PostmanDataFolder": "./datafiles/",
  "FeatureTestsFolder": "./featuretests/",
  "HistoryFilePrefix": "hist_",
  "ResultFileSuffix": "results"
};