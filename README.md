**EnvironmentStatus: Monitor Application Uptime and Performance with Postman Collections**

**Overview:**

- Gain insights into your application/feature uptime across multiple environments with customizable dashboards.
- Track historical uptime trends and recent performance metrics (last 30 days, 14 days, 7 days, 24 hrs).
- Analyse response time graphs for each collection, with the option to exclude outliers.
- **Fully dynamic environment support** - add unlimited environments without code changes.

**Key Features:**

- **Uptime Dashboard (Dashboard.html):** Visualize uptime with doughnut charts, with each collection having segments for different environments/regions/apps/features.
- **Performance Dashboard:** View time-series graphs of response times, excluding failures.
- **Dynamic Environment Support:** Add/remove environments through simple configuration - all routes, validation, and UI adapt automatically.
- **Environment Initialization Script:** One-command setup for new environments with `scripts/init-environment.js`.
- **Flexible Scheduling:** Adjust test execution frequency with cron expressions.
- **Postman Integration:** Reuse existing Postman collections, environments, and data files.
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

2. **Add Postman Files:**

   - Place collections into the `collections` folder.
   - Place environments into the `environments` folder.
   - Place data files into the `datafiles` folder.

3. **Edit Schedule (`Edit Schedule` menu):**

   - Specify Postman collection, environment, and data file names for each environment.
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

**Environment Variables (.env file):**

- `PORT=<Your desired port>` (default: 8080)
- `SECRET=<Session management secret>` (required if session authentication is enabled)
- `INFLUXDB_TOKEN=<InfluxDB API Token>` (required if InfluxDB integration is enabled)

**Configuration (config/config.js):**

- `environments`: Array of environment configurations (supports unlimited environments)
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

- Sample tests are provided; replace them with your own Postman collections.
- All environments are validated to prevent path traversal and injection attacks.
- Frontend utilities available in `public/js/api.js` for consistent API interactions.
- Constants centralized in `config/constants.js` for easy maintenance.
- Comprehensive test suite with 40+ tests covering API functionality and error scenarios.
- Generic HTML templates automatically work for all environments.

**Architecture Highlights:**

- **Middleware-based security**: Authentication, validation, and error handling
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
│   └── ui.test.js         # UI tests
├── collections/           # Postman collections
├── environments/          # Postman environments
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

---

**Documentation:**
- See `ADDING_ENVIRONMENTS.md` for detailed environment setup guide
- See `TESTING_IMPROVEMENTS.md` for testing strategy
- See `MERGED_DASHBOARD_CHANGES.md` for dashboard features
