**EnvironmentStatus: Monitor Application Uptime and Performance with Automated Test Collections**

**What is EnvironmentStatus?**

EnvironmentStatus is a monitoring/dashboard **platform** that allows development teams to run scheduled tests against their applications and display the results on dashboards. It is **not** a test suite — it is the solution that *runs* your tests and *visualizes* the results.

Teams choose their preferred test tools — **Postman (Newman)**, **Bruno**, **Supertest** for API testing, and **Playwright** for UI testing — and the platform executes them on a schedule, stores results, and presents uptime and performance dashboards.

> **Note:** The test scripts included in this repository are **example/demo tests** that exercise the EnvironmentStatus app's own API. They demonstrate how a consumer would configure and use the platform. Unit tests (`tests/unit/`, `tests/runners.test.js`) are internal to the app and are not part of the consumer-facing solution.

**Overview:**

- Gain insights into your application/feature uptime across multiple environments with customizable dashboards.
- Track historical uptime trends and recent performance metrics (last 30 days, 14 days, 7 days, 24 hrs).
- Analyse response time graphs for each test suite, with the option to exclude outliers.
- **Fully dynamic environment support** - add unlimited environments without code changes.
- **Pluggable test runners** - use Newman (Postman), Bruno, Playwright, Supertest, or add your own.

**Key Features:**

- **Uptime Dashboard (Dashboard.html):** Visualize uptime with doughnut charts, with each test suite having segments for different environments/regions/apps/features.
- **Performance Dashboard:** View time-series graphs of response times, excluding failures.
- **Dynamic Environment Support:** Add/remove environments through simple configuration - all routes, validation, and UI adapt automatically.
- **Environment Initialization Script:** One-command setup for new environments with `scripts/init-environment.js`.
- **Flexible Scheduling:** Adjust test execution frequency with cron expressions.
- **Multi-Runner Support:** Run tests with Newman (Postman), Bruno, Playwright, or add custom adapters. Mix runners per test within the same schedule.
- **Outlier Management:** Edit history files to refine performance graphs and add comments for transparency.
- **Deployment Readiness API:** Query uptime status before deployment using `/readyToDeploy/{env}` and `/readyToDeploy/{env}/{collection name}` endpoints.
- **Security Hardened:** Path traversal prevention, input validation, and authentication middleware.
- **Optional Authentication:** Enable basic login and session management for added security.
- **InfluxDB Integration:** Optionally send data to InfluxDB for extended analysis.
- **Comprehensive Error Handling:** Standardized error responses and logging across all endpoints.

**Setup Instructions:**

1. **Configure Environments:**

   - Edit `config/config.js` and define your environments:
   ```javascript
   environments: [
     { id: "dev", name: "Dev", displayName: "Development" },
     { id: "test", name: "Test", displayName: "Test" },
     { id: "staging", name: "Staging", displayName: "Staging" },
     { id: "prod", name: "Prod", displayName: "Production" }
   ]
   ```

   - **OR** use the initialization script for new environments:
   ```bash
   node scripts/init-environment.js <env-id> <env-name> [display-name]
   # Example: node scripts/init-environment.js qa QA "Quality Assurance"
   ```

2. **Add Test Files:**

   - Place Postman/Newman collections into `tests/postman/collections/`.
   - Place Postman environment files into `tests/postman/environments/`.
   - Place data files into `tests/postman/datafiles/`.
   - Place Playwright spec files into `tests/playwright-api/specs/` (API) or `tests/playwright-ui/` (UI).
   - Place Supertest spec files into `tests/supertest/specs/`.
   - Place Bruno collection folders into `tests/bruno/collections-api/`.

3. **Edit Schedule (`Edit Schedule` menu):**

   - Specify script name, environment, data file, and **runner** for each test.
   - Supported runners: `newman` (default), `bruno`, `playwright`, `supertest`.
   - Different tests in the same environment can use different runners.
   - All runners should have identical schedule entries covering the same functional areas (e.g. dashboard, data, deploy, performance) to ensure dashboard parity.
   - The dashboard automatically detects all configured environments.

4. **Customize Run Frequency:**
   
   - Modify cron expressions in `config/config.js` (default: every minute).
   - Supports standard cron syntax for flexible scheduling.

5. **(Optional) InfluxDB Setup:**
   - Enable the `Influx` flag in `config/config.js`.
   - Add your API key to the `.env` file.

**Getting Started:**

1. **Prerequisites:** Node.js
2. **Install Dependencies:** `npm install`
3. **Run:** `node index.js`

**Docker Setup:**

The app runs in Docker with mutable data (results, collections, config, etc.) stored on the host via volume mounts. This keeps the container stateless — you can rebuild or redeploy without losing data.

1. **Using Docker Compose (recommended):**
   ```bash
   docker compose up -d
   ```
   This builds the image, starts the container, and mounts all data directories from your local project. Any changes to results, test collections, environments, datafiles, schedules, or config persist on your host.

2. **Stop / restart:**
   ```bash
   docker compose down      # stop and remove container
   docker compose up -d     # start again (data is preserved)
   ```

3. **Using plain Docker** (without Compose):
   ```bash
   docker build -f dockerfile -t env-status-monitor .

   docker run -d -p 8080:8080 --name env-status-monitor \
     -v ./results:/usr/src/app/results \
     -v ./tests/postman/collections:/usr/src/app/tests/postman/collections \
     -v ./tests/postman/environments:/usr/src/app/tests/postman/environments \
     -v ./tests/postman/datafiles:/usr/src/app/tests/postman/datafiles \
     -v ./tests/bruno/collections-api:/usr/src/app/tests/bruno/collections-api \
     -v ./schedules:/usr/src/app/schedules \
     -v ./config:/usr/src/app/config \
     env-status-monitor
   ```

4. **With environment variables** (e.g. session auth or InfluxDB):
   ```bash
   docker compose up -d  # reads from .env file automatically
   ```
   Or with plain Docker:
   ```bash
   docker run -d -p 8080:8080 --name env-status-monitor \
     -v ./results:/usr/src/app/results \
     -v ./tests/postman/collections:/usr/src/app/tests/postman/collections \
     -v ./tests/postman/environments:/usr/src/app/tests/postman/environments \
     -v ./tests/postman/datafiles:/usr/src/app/tests/postman/datafiles \
     -v ./tests/bruno/collections-api:/usr/src/app/tests/bruno/collections-api \
     -v ./schedules:/usr/src/app/schedules \
     -v ./config:/usr/src/app/config \
     -e SECRET=your-session-secret \
     -e INFLUXDB_TOKEN=your-influx-token \
     env-status-monitor
   ```

**Mounted Directories:**

| Directory | Contents | Mutated at runtime |
|-----------|----------|-------------------|
| `results/` | Test results and history files | Yes — every cron cycle |
| `tests/postman/collections/` | Postman/Newman collection files | Yes — via uploads |
| `tests/postman/environments/` | Environment configuration files | Yes — via uploads |
| `tests/postman/datafiles/` | Test data files | Yes — via uploads |
| `schedules/` | Test schedule configuration | Yes — via schedule editor |
| `config/` | Application configuration | Yes — via config API |
| `tests/bruno/collections-api/` | Bruno collection directories | Yes — via uploads or manual edits |

The app will be available at `http://localhost:8080`.

**Environment Variables (.env file):**

- `PORT=<Your desired port>` (default: 8080)
- `SECRET=<Session management secret>` (required if session authentication is enabled)
- `INFLUXDB_TOKEN=<InfluxDB API Token>` (required if InfluxDB integration is enabled)

**Configuration (config/config.js):**

- `environments`: Array of environment configurations (supports unlimited environments)
- `DefaultRunner`: Which test runner to use when not specified per-test (default: `newman`)
- `session`: Enable/disable authentication (default: false)
- `Influx`: Enable/disable InfluxDB integration (default: false)
- `ExtendedLog`: Enable detailed logging (default: false)
- `Green/Amber`: Uptime percentage thresholds for dashboard colors
- Cron schedules for test execution frequency

**Adding New Environments:**

The application is fully dynamic - add as many environments as needed:

1. **Quick setup** - Run the initialization script:
   ```bash
   node scripts/init-environment.js myenv MyEnv "My Environment"
   ```

2. **Add to config** - Update `config/config.js`:
   ```javascript
   { id: "myenv", name: "MyEnv", displayName: "My Environment" }
   ```

3. **Restart** - All routes, validation, cron jobs, and UI automatically adapt!

See `ADDING_ENVIRONMENTS.md` for detailed documentation.

**Test Runners:**

The app supports multiple test runners via a pluggable adapter pattern. Set a per-test runner in `schedules/collections.json`, or set a default in `config/config.js`:

```javascript
"DefaultRunner": "newman"  // Options: "newman", "bruno", "playwright", "supertest"
```

Each test in the schedule can specify its own runner and schedule:

```json
{
  "script_name": "api-checks.json",
  "environment_name": "envstatus_dev.json",
  "datafile": "data.json",
  "runner": "newman",
  "schedule": "Every15",
  "Active": "1"
}
}
```

| Runner | Script type | Location | Environment file | Notes |
|--------|-------------|----------|-----------------|-------|
| `newman` | Postman collection JSON | `tests/postman/collections/` | `tests/postman/environments/` | Default. Uses Newman CLI. |
| `bruno` | Bruno collection directory | `tests/bruno/collections-api/` | `tests/bruno/collections-api/environments/` | Requires `@usebruno/cli`. |
| `playwright` | Playwright spec file (`.spec.js`) | `tests/playwright-api/specs/` | Passed via `TEST_ENVIRONMENT_FILE` env var | Requires `@playwright/test`. |
| `supertest` | Mocha/Supertest spec file (`.test.js`) | `tests/supertest/specs/` | N/A (uses `MONITOR_BASE_URL` env var) | Requires `supertest` + `mocha`. |

To add a custom runner, create a module in `runners/` that exports a `run(options)` method returning `{ passed, totalTests, failedTests, avgResponseTime, executionNames, rawResult }`, then register it in `runners/index.js`.

**API Endpoints:**

Dynamic endpoints available for each configured environment:

| Endpoint | Description |
|----------|-------------|
| `GET /results/{env}/` | All current test results for an environment |
| `GET /results/{env}/{runner}/` | Current results filtered by runner |
| `GET /getSummaryStats/{env}[/{days}]` | Summary statistics (last N days) |
| `GET /getSummaryStats/{env}/{runner}/{days}` | Summary statistics filtered by runner |
| `GET /histresultskeys/{env}[?runner={runner}]` | Available historical test keys, optionally filtered by runner |
| `GET /histresults/{env}/{key}[/{days}]` | Historical results for a key |
| `GET /histresultsdays/{env}/{key}/{days}[?runner={runner}]` | Historical results for a key by day count, optionally filtered by runner |
| `GET /getStats/{env}/{key}` | Feature-specific statistics |
| `GET /readyToDeploy/{env}[/{key}]` | Deployment readiness check |
| `GET /api/runners` | List of registered runner adapters |
| `GET /run{EnvName}` | Manually trigger tests (e.g., `/runDev`) |
| `GET /data/{env}results` | Results editor interface |

All endpoints include automatic validation and security checks.

**Additional Notes:**

- Sample tests are provided; replace them with your own test scripts.
- All environments are validated to prevent path traversal and injection attacks.
- Frontend utilities available in `public/js/api.js` for consistent API interactions.
- Constants centralized in `config/constants.js` for easy maintenance.
- Comprehensive test suite with 40+ tests covering API functionality and error scenarios.
- Generic HTML templates automatically work for all environments.

**Architecture Highlights:**

- **Middleware-based security**: Authentication, validation, and error handling
- **Pluggable runner adapters**: Newman, Bruno, Playwright with a common interface
- **Factory patterns**: Reusable upload configurations and route handlers
- **Dynamic route generation**: All endpoints auto-created from config
- **Centralized constants**: No magic numbers scattered in code
- **Backward compatible**: All changes maintain existing API contracts

## Running Tests

### Playwright Tests

Playwright is used for both UI and API testing. Follow the steps below to run the tests.

#### 1. Install Playwright

Install Playwright and its dependencies:

```bash
npm install -D @playwright/test wait-on
npx playwright install --with-deps chromium
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

To run only the API tests (includes error handling tests):

```bash
npx playwright test --project="API Tests"
```

#### 5. Run Collection Tests (Playwright)

Dedicated tests modelling the 4 Postman collections using Page Object Model (UI) and Playwright `request` (API):

```bash
# UI tests using Page Object Model
npx playwright test --project="Collections UI Tests"

# API tests using Playwright request
npx playwright test --project="Collections API Tests"
```

**Collection Test Coverage:**

| Postman Collection | Endpoints | UI Tests | API Tests |
|---|---|---|---|
| Dashboard | `GET /dashboard` | 1 | 1 |
| Data | `GET /data/directory`, `GET /data/schedule` | 2 | 2 |
| Deploy | `GET /readyToDeploy/:env`, `GET /readyToDeploy/:env/:trans` | 2 | 2 |
| Performance | `GET /dashboard/performance/:env/All`, `GET /dashboard/performance/:env/30` | 2 | 2 |

Page Object Models are located in `tests/playwright-ui/pages/` with classes for each page (DashboardPage, DataPage, DeployPage, PerformancePage).

### Supertest Tests

Supertest tests provide direct HTTP testing against the Express app without starting a server. They model the same 4 Postman collections:

```bash
npm run test:supertest
```

Uses Mocha + Supertest. Tests are in `tests/supertest/collections-supertest.test.js` and individual spec files in `tests/supertest/specs/`.

### Bruno Tests

Bruno collections provide API testing using the Bruno CLI. They model the same 4 Postman collections:

```bash
# Requires the server to be running on port 8080
npm run test:bruno
```

Bruno collections are in `tests/bruno/collections-api/` organized by collection folder (dashboard, data, deploy, performance). Each `.bru` file contains the request definition, assertions, and tests.

### All Test Commands

| Command | Runner | Description |
|---------|--------|-------------|
| `npx playwright test` | Playwright | All Playwright tests (UI + API) |
| `npx playwright test --project="Collections UI Tests"` | Playwright | Collection UI tests with Page Object Model |
| `npx playwright test --project="Collections API Tests"` | Playwright | Collection API tests with Playwright request |
| `npm run test:supertest` | Supertest | Collection API tests with Mocha/Supertest/Chai |
| `npm run test:bruno` | Bruno | Collection API tests with Bruno CLI |

**Test Coverage:**
- 12 core API functionality tests
- 29 error handling and security tests
- Environment validation and path traversal prevention
- Data consistency and validation checks

#### 5. Debugging Tests

To run tests in headed mode for debugging:

```bash
npx playwright test --headed
```

#### 6. Running Tests in CI

The GitHub Actions workflow automatically:
- Installs dependencies
- Installs Playwright browsers
- Creates necessary test data files
- Runs both API and UI tests
- Uploads test results as artifacts

---

## Test Configuration

### Global Setup and Teardown

The Playwright tests use global setup and teardown scripts to start and stop the server automatically.

- **Global Setup**: Starts the server before running the tests using `node index.js`
  - File: `tests/global-setup.js`
  - Waits up to 120 seconds for the server to be ready
- **Global Teardown**: Stops the server after the tests complete using SIGTERM
  - File: `tests/global-teardown.js`

### Playwright Configuration

The Playwright configuration is defined in `playwright.config.js`. It includes:
- Separate projects for UI and API tests
- BaseURL configuration for all tests
- 30 second timeout per test
- 1 retry on failure
- Global setup/teardown for server management

### Test Data Requirements

Tests require sample data files in the `results/` directory. These are automatically created in CI, but for local testing you may need to run the application first to generate data, or create sample files.

---

## Project Structure

```
├── config/
│   ├── config.js           # Main configuration (environments, cron, paths)
│   └── constants.js        # Centralized constants
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── validation.js       # Input validation & sanitization
│   └── errorHandler.js     # Standardized error handling
├── routes/
│   ├── dashboards.js       # Dashboard page routes
│   ├── data.js             # Data management routes
│   ├── deploy.js           # Deployment readiness API
│   └── upload.js           # File upload handling
├── runners/                # Pluggable test runner adapters
│   ├── index.js            # Runner registry and factory
│   ├── newman.js           # Newman (Postman) adapter
│   ├── bruno.js            # Bruno CLI adapter
│   ├── playwright.js       # Playwright adapter
│   └── supertest.js        # Mocha/Supertest adapter
├── schedules/              # Test schedule configuration
│   ├── collections.json    # Live schedule (edited via UI or manually)
│   └── template.json       # Template for new schedules
├── tests/                  # All test code
│   ├── global-setup.js     # Playwright global setup (starts server)
│   ├── global-teardown.js  # Playwright global teardown (stops server)
│   ├── runners.test.js     # Internal: runner adapter tests
│   ├── unit/
│   │   └── functions.test.js   # Internal: utility function tests
│   ├── postman/            # Newman/Postman test assets
│   │   ├── collections/    # Collection JSON files (dashboard, data, deploy, performance)
│   │   ├── environments/   # Environment files (envstatus_{dev,test,staging,prod}.json)
│   │   ├── datafiles/      # Data files (data.json)
│   │   └── newman/         # Newman adapter helper
│   ├── playwright-api/     # Playwright API tests
│   │   ├── api.test.js             # Core API tests (internal)
│   │   ├── api-errors.test.js      # Error handling tests (internal)
│   │   ├── collections-api.test.js # Collection API tests (internal)
│   │   ├── schedule.config.js      # Playwright config for scheduled runs
│   │   └── specs/                  # Schedulable spec files
│   │       ├── dashboard.spec.js   # Dashboard routes → result key "dashboard"
│   │       ├── data.spec.js        # Data routes → result key "data"
│   │       ├── deploy.spec.js      # Deploy routes → result key "deploy"
│   │       ├── performance.spec.js # Performance routes → result key "performance"
│   │       └── example-health.spec.js  # Example health check (not scheduled)
│   ├── playwright-ui/      # Playwright UI tests
│   │   ├── ui.test.js              # UI smoke tests (internal)
│   │   ├── collections-ui.test.js  # Collection UI tests (internal)
│   │   └── pages/                  # Page Object Models
│   │       ├── DashboardPage.js
│   │       ├── DataPage.js
│   │       ├── DeployPage.js
│   │       └── PerformancePage.js
│   ├── supertest/          # Supertest/Mocha tests
│   │   ├── supertest.js              # Supertest adapter helper
│   │   ├── collections-supertest.test.js  # Combined collection test (internal)
│   │   └── specs/                    # Schedulable spec files
│   │       ├── dashboard.test.js     # Dashboard routes → result key "dashboard"
│   │       ├── data.test.js          # Data routes → result key "data"
│   │       ├── deploy.test.js        # Deploy routes → result key "deploy"
│   │       ├── performance.test.js   # Performance routes → result key "performance"
│   │       └── api-health.test.js    # API health checks (not scheduled)
│   └── bruno/              # Bruno CLI tests
│       └── collections-api/
│           ├── bruno.json / collection.bru
│           ├── environments/   # Bruno env files (local.bru)
│           ├── dashboard/      # Dashboard collection requests
│           ├── data/           # Data collection requests
│           ├── deploy/         # Deploy collection requests
│           └── performance/    # Performance collection requests
├── public/
│   └── js/
│       ├── api.js          # Shared frontend utilities
│       ├── dashboard.js    # Dashboard chart logic
│       ├── performance.js  # Performance charts
│       └── config.js       # Configuration editor
├── pages/                  # HTML pages
├── results/                # Test results (generated at runtime)
├── scripts/
│   └── init-environment.js # Environment initialization helper
├── index.js                # Entry point
└── server.js               # Express server, routes, cron scheduling
```

> **Internal vs Schedulable tests:** Files marked "internal" test the EnvironmentStatus app
> itself (unit tests, error handling, etc.) and are run during development/CI. Files in
> `specs/` directories are the schedulable test collections that would be replaced by
> consumer teams with their own application tests. Both sets of tests cover the same
> 4 functional areas (dashboard, data, deploy, performance) to serve as working examples.

## Recent Improvements

**Security Enhancements:**
- ✅ Path traversal prevention on all environment routes
- ✅ Input validation middleware with environment whitelisting
- ✅ Secure session secret validation
- ✅ Standardized error handling without information leakage

**Code Quality:**
- ✅ Eliminated 250+ lines of duplicated code
- ✅ Created reusable middleware (auth, validation, error handling)
- ✅ Factory patterns for upload configurations
- ✅ Centralized constants file
- ✅ Shared frontend API utilities

**Dynamic Architecture:**
- ✅ All routes generated from config (no hardcoded environments)
- ✅ Generic HTML templates work for unlimited environments
- ✅ Automatic validation for new environments
- ✅ One-command environment initialization script

**Dashboard & Performance:**
- ✅ Performance graphs filter by runner when accessed from a runner-specific dashboard
- ✅ Dashboard config cleaned up to 6 semantic entries (default, newman, playwright-api, playwright-ui, supertest, bruno)
- ✅ Runner filter dropdown in dashboard editor includes all 4 runners (newman, playwright, supertest, bruno)
- ✅ `?runner=` query param supported on `/histresultskeys` and `/histresultsdays` endpoints

**Runner Reliability:**
- ✅ Supertest/Mocha runner now passes `--exit --timeout 30000` to prevent hang on keep-alive connections

**Testing:**
- ✅ Increased test coverage by 241% (12 → 41 tests)
- ✅ Comprehensive error scenario testing
- ✅ Security validation tests
- ✅ Multi-environment test coverage
- ✅ Collection tests modelling all 4 Postman collections across Playwright (UI + API), Supertest, and Bruno
- ✅ Page Object Model pattern for UI test maintainability
- ✅ Multiple test runner support: Playwright, Supertest (Mocha/Chai), Bruno CLI

---

**Documentation:**
- See `TESTING_IMPROVEMENTS.md` for testing strategy
- See `MERGED_DASHBOARD_CHANGES.md` for dashboard features
