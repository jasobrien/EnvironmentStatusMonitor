**EnvironmentStatus: Monitor Application Uptime and Performance with Postman Collections**

**Overview:**

- Gain insights into your application/feature uptime across multiple environments with customizable dashboards.
- Track historical uptime trends and recent performance metrics (last 30 days, 14 days, 7 days, 24 hrs).
- Analyse response time graphs for each collection, with the option to exclude outliers.

**Key Features:**

- **Uptime Dashboard (Dashboard.html):** Visualize uptime with doughnut charts, with each collection having segments for different environments/regions/apps/features.
- **Performance Dashboard:** View time-series graphs of response times, excluding failures.
- **Flexible Scheduling:** Adjust test execution frequency.
- **Postman :** Reuse existing Postman collections, environments, and data files.
- **Outlier Management:** Edit history files to refine performance graphs and add comments for transparency.
- **Deployment Readiness API:** Query uptime status before deployment using `/readyToDeploy/{env}` and `/readyToDeploy/{env}/{collection name}` endpoints.
- **Optional Authentication:** Enable basic login and session management for added security.
- **InfluxDB Integration:** Optionally send data to InfluxDB for extended analysis.

**Setup Instructions:**

1. **Add Postman Files:**

   - Place collections into the `collections` folder.
   - Place environments into the `environment` folder.
   - Place data files into the `datafiles` folder.

2. **Edit Schedule (`Edit Schedule` menu):**

   - Specify Postman collection, environment, and data file names for each environment (Dev, Test, Staging).

3. **Clear Results:** Delete files within the `results` folder (regenerated on the first run).

4. **Customize Run Frequency (server.js):** Modify lines 281-283 (default: every 10 minutes, Cron syntax supported).

5. **(Optional) InfluxDB Setup:**
   - Enable the `influx` flag in `config.json`.
   - Add your API key to the `.env` file.

**Getting Started:**

1. **Prerequisites:** Node.js
2. **Install Dependencies:** `npm install`
3. **Run:** `node index.js`

**Environment Variables (.env file):**

- `PORT= <Your desired port>`
- `SECRET= <Session management secret>`
- `INFLUXDB_TOKEN= <InfluxDB API Token>`

**Additional Notes:**

- Sample tests are provided; replace them with your own.
- Consider adding screenshots or a demo GIF.

## Running Tests

### Playwright Tests

Playwright is used for both UI and API testing. Follow the steps below to run the tests.

#### 1. Install Playwright

Install Playwright and its dependencies:

```bash
npm install -D @playwright/test wait-on
```

#### 2. Run All Tests

To run all tests (UI and API):

```bash
npx playwright test
```

#### 3. Run Only UI Tests

To run only the UI tests:

```bash
npx playwright test --project="UI Tests"
```

#### 4. Run Only API Tests

To run only the API tests:

```bash
npx playwright test --project="API Tests"
```

#### 5. Debugging Tests

To run tests in headed mode for debugging:

```bash
npx playwright test --headed
```

---

## Test Configuration

### Global Setup and Teardown

The Playwright tests use global setup and teardown scripts to start and stop the server automatically.

- **Global Setup**: Starts the server before running the tests.
  - File: `test/global-setup.js`
- **Global Teardown**: Stops the server after the tests complete.
  - File: `test/global-teardown.js`

### Playwright Configuration

The Playwright configuration is defined in `playwright.config.js`. It includes separate projects for UI and API tests.
