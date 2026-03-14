**EnvironmentStatus: Monitor Application Uptime and Performance with Automated Test Collections**

**Overview:**

- Gain insights into your application/feature uptime across multiple environments with customizable dashboards.
- Track historical uptime trends and recent performance metrics (last 30 days, 14 days, 7 days, 24 hrs).
- Analyse response time graphs for each test suite, with the option to exclude outliers.
- **Fully dynamic environment support** - add unlimited environments without code changes.
- **Pluggable test runners** - use Newman (Postman), Bruno, Playwright, or add your own.

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

   - Place test scripts/collections into the `collections` folder.
   - Place environment files into the `environments` folder.
   - Place data files into the `datafiles` folder.

3. **Edit Schedule (`Edit Schedule` menu):**

   - Specify script name, environment, data file, and **runner** for each test.
   - Supported runners: `newman` (default), `bruno`, `playwright`.
   - Different tests in the same environment can use different runners.
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
   This builds the image, starts the container, and mounts all data directories from your local project. Any changes to results, collections, environments, datafiles, featuretests, or config persist on your host.

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
     -v ./collections:/usr/src/app/collections \
     -v ./environments:/usr/src/app/environments \
     -v ./datafiles:/usr/src/app/datafiles \
     -v ./featuretests:/usr/src/app/featuretests \
     -v ./config:/usr/src/app/config \
     -v ./bruno:/usr/src/app/bruno \
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
     -v ./collections:/usr/src/app/collections \
     -v ./environments:/usr/src/app/environments \
     -v ./datafiles:/usr/src/app/datafiles \
     -v ./featuretests:/usr/src/app/featuretests \
     -v ./config:/usr/src/app/config \
     -v ./bruno:/usr/src/app/bruno \
     -e SECRET=your-session-secret \
     -e INFLUXDB_TOKEN=your-influx-token \
     env-status-monitor
   ```

**Mounted Directories:**

| Directory | Contents | Mutated at runtime |
|-----------|----------|-------------------|
| `results/` | Test results and history files | Yes — every cron cycle |
| `collections/` | Test scripts and collection files | Yes — via uploads |
| `environments/` | Environment configuration files | Yes — via uploads |
| `datafiles/` | Test data files | Yes — via uploads |
| `featuretests/` | Test schedule configuration | Yes — via schedule editor |
| `config/` | Application configuration | Yes — via config API |
| `bruno/` | Bruno collection directories | Yes — via uploads or manual edits |

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

The app supports multiple test runners via a pluggable adapter pattern. Set a per-test runner in `featuretests/collections.json`, or set a default in `config/config.js`:

```javascript
"DefaultRunner": "newman"  // Options: "newman", "bruno", "playwright"
```

Each test in the schedule can specify its own runner:

```json
{
  "script_name": "api-checks.json",
  "environment_name": "envstatus_dev.json",
  "datafile": "data.json",
  "runner": "newman",
  "Active": "1"
}
```

| Runner | Script type | Environment file | Notes |
|--------|-------------|-----------------|-------|
| `newman` | Postman collection JSON | Postman environment JSON | Default. Uses Newman CLI. |
| `bruno` | Bruno collection directory | Bruno environment JSON | Requires `@usebruno/cli`. |
| `playwright` | Playwright spec file (`.spec.js`) | Passed via `TEST_ENVIRONMENT_FILE` env var | Requires `@playwright/test`. |
| `supertest` | Mocha/Supertest spec file (`.test.js`) | Postman-style environment JSON | Requires `supertest` + `mocha`. Sets `MONITOR_BASE_URL`. |

To add a custom runner, create a module in `runners/` that exports a `run(options)` method returning `{ passed, totalTests, failedTests, avgResponseTime, executionNames, rawResult }`, then register it in `runners/index.js`.

**API Endpoints:**

Dynamic endpoints available for each configured environment:

- `GET /results/{env}/` - Current test results
- `GET /getSummaryStats/{env}[/{days}]` - Summary statistics
- `GET /histresultskeys/{env}` - Available test keys
- `GET /histresults/{env}/{key}[/{days}]` - Historical results
- `GET /getStats/{env}/{key}` - Feature-specific statistics
- `GET /readyToDeploy/{env}[/{key}]` - Deployment readiness check
- `GET /run{EnvName}` - Manually trigger tests (e.g., `/runDev`)
- `GET /data/{env}results` - Results editor interface

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

Page Object Models are located in `test/pages/` with classes for each page (DashboardPage, DataPage, DeployPage, PerformancePage).

### Supertest Tests

Supertest tests provide direct HTTP testing against the Express app without starting a server. They model the same 4 Postman collections:

```bash
npm run test:supertest
```

Uses Mocha + Supertest + Chai. Tests are in `test/collections-supertest.test.js`.

### Bruno Tests

Bruno collections provide API testing using the Bruno CLI. They model the same 4 Postman collections:

```bash
# Requires the server to be running on port 8080
npm run test:bruno
```

Bruno collections are in `bruno/collections-api/` organized by collection folder (dashboard, data, deploy, performance). Each `.bru` file contains the request definition, assertions, and tests.

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
  - File: `test/global-setup.js`
  - Waits up to 120 seconds for the server to be ready
- **Global Teardown**: Stops the server after the tests complete using SIGTERM
  - File: `test/global-teardown.js`

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
│   ├── config.js           # Main configuration (environments, settings)
│   └── constants.js        # Centralized constants (NEW)
├── middleware/             # NEW - Security & validation
│   ├── auth.js            # Authentication middleware
│   ├── validation.js      # Input validation & sanitization
│   └── errorHandler.js    # Standardized error handling
├── routes/
│   ├── dashboards.js      # Dashboard page routes
│   ├── data.js            # Data management routes
│   ├── deploy.js          # Deployment readiness API
│   └── upload.js          # File upload handling
├── runners/               # Pluggable test runner adapters
│   ├── index.js           # Runner registry and factory
│   ├── newman.js          # Newman (Postman) adapter
│   ├── bruno.js           # Bruno CLI adapter
│   ├── playwright.js      # Playwright adapter
│   └── supertest/         # Supertest adapter
│       └── supertest.js   # Mocha/Supertest runner
├── bruno/                 # Bruno test collections
│   └── collections-api/   # API collection modelling Postman tests
│       ├── bruno.json
│       ├── collection.bru
│       ├── environments/  # Bruno environment files
│       ├── dashboard/     # Dashboard collection requests
│       ├── data/          # Data collection requests
│       ├── deploy/        # Deploy collection requests
│       └── performance/   # Performance collection requests
├── public/
│   └── js/
│       ├── api.js         # NEW - Shared frontend utilities
│       ├── dashboard.js   # Dashboard logic
│       ├── performance.js # Performance charts
│       └── config.js      # Configuration editor
├── pages/
│   ├── dashboard.html     # Main dashboard
│   ├── performance.html   # Performance page
│   ├── results-editor.html # NEW - Generic editor for all envs
│   └── *.html            # Other pages
├── scripts/
│   └── init-environment.js # NEW - Environment initialization
├── test/
│   ├── api.test.js        # Core API tests
│   ├── api-errors.test.js # NEW - Error handling tests
│   ├── ui.test.js         # UI tests
│   ├── collections-ui.test.js    # Collection UI tests (Page Object Model)
│   ├── collections-api.test.js   # Collection API tests (Playwright request)
│   ├── collections-supertest.test.js # Collection API tests (Supertest)
│   └── pages/             # Page Object Models
│       ├── DashboardPage.js
│       ├── DataPage.js
│       ├── DeployPage.js
│       └── PerformancePage.js
├── collections/           # Test scripts and collections
├── environments/          # Environment configuration files
├── results/              # Test results (generated)
└── server.js             # Main server with dynamic routing
```

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
- See `ADDING_ENVIRONMENTS.md` for detailed environment setup guide
- See `TESTING_IMPROVEMENTS.md` for testing strategy
- See `MERGED_DASHBOARD_CHANGES.md` for dashboard features
