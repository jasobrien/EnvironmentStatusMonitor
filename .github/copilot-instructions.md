# EnvironmentStatus Monitor — Copilot Instructions

## What this app is

A **monitoring platform** (not a test suite itself) that runs scheduled API/UI test collections against external apps via pluggable runners and visualises uptime + performance on a polar-area dashboard. Tests that ship in `tests/` are demos that exercise this app's own API — real consumers replace them with their own.

## High-level architecture

1. **Scheduler** (`server.js` cron block) reads `schedules/collections.json`, creates a `CronJob` per (environment × unique schedule key) using cron expressions defined in `config/config.js` (e.g. `Every15`, `Every30`).
2. **Runner dispatch** — for each fired schedule, `runTests(region, envId, scheduleKey)` groups tests by `runner` field. Runners (`runners/newman.js`, `bruno.js`, `playwright.js`, `supertest.js`) implement a common adapter contract (`run(options) → { passed, totalTests, failedTests, avgResponseTime, executionNames, rawResult }`) and are registered in `runners/index.js`. Different runners execute concurrently; tests inside a runner group execute sequentially.
3. **Result storage** — each test appends one NDJSON object to `results/{env}_{runner}.json` (current) and `results/hist_{env}_{runner}.json` (history). When `Influx: true` and `INFLUXDB_TOKEN` is set, `influx.js` also pushes metrics to InfluxDB.
4. **Frontend** — `public/js/dashboard.js` fetches `GET /config` to discover environments, then aggregates `/results/{env}/[{runner}/]` and `/getSummaryStats/...` into a single Chart.js polar area chart (segments = test keys; rings = environments). Saved views at `/dashboard/view/:id` apply `environments[]`, `tests[]`, and `runner` filters from `config/dashboards.json`.

## Configuration (single source of truth)

- **`config/config.js`** — `environments` array, cron expressions, folder paths, RAG thresholds (`Green`, `Amber`), feature flags (`session`, `Influx`, `ExtendedLog`), default runner, default credentials.
- **`config/constants.js`** — HTTP status codes, RAG colours, session cookie config, uptime periods, refresh intervals.
- **`config/dashboards.json`** — saved dashboard views (CRUD via `/api/dashboards` and `/dashboard/manage`).
- **`schedules/collections.json`** — `ENV[].tests[]` entries with `script_name`, `environment_name`, `datafile`, `runner`, `schedule`, `Active`.

> The legacy `ENV1`/`Env1Name` properties were removed; the `environments` array is the only source. See `ENVIRONMENT_CONSOLIDATION.md`.

## Filesystem layout (current — do not assume older layouts)

```
config/        config.js, constants.js, dashboards.json
middleware/    auth.js, validation.js, errorHandler.js
routes/        dashboards.js, data.js, deploy.js, upload.js
runners/       index.js (registry), newman.js, bruno.js, playwright.js, supertest.js
schedules/     collections.json (live), template.json
scripts/       init-environment.js, migrate-results-to-per-runner.js
tests/
  postman/{collections,environments,datafiles}/
  playwright-api/{specs/, *.test.js}     # specs/ are schedulable; *.test.js are internal
  playwright-ui/{pages/, *.test.js}
  supertest/{specs/, *.test.js}
  bruno/collections-api/{dashboard,data,deploy,performance,environments}/
  unit/, runners.test.js, global-setup.js, global-teardown.js
public/        css/, js/ (api.js, dashboard.js, performance.js, config.js, header.js)
pages/         dashboard.html, performance.html, login.html, config.html, schedule.html,
               schedules.html, results-editor.html, upload.html, uploadsuccess.html,
               manage-dashboards.html, header.html
results/       {env}_{runner}.json, hist_{env}_{runner}.json, logs.json
```

> Older docs sometimes reference top-level `collections/`, `environments/`, `datafiles/`, `featuretests/`, or `test/` folders — those paths no longer exist. Use the paths above.

## Adding things

- **New environment** → run `node scripts/init-environment.js <id> <name> [displayName]` (seeds files only), then add it to `environments` in `config/config.js` and restart. All routes, validators, cron jobs, and dashboard rings are generated from the array.
- **New test** → drop the script/collection in the appropriate `tests/<runner>/...` folder and add an entry to `schedules/collections.json` with the right `runner` and `schedule`. Keep the four canonical test keys (`dashboard`, `data`, `deploy`, `performance`) when you want them to appear together as polar-chart segments.
- **New runner** → create `runners/<name>.js` exporting `{ run(options) }` and call `register('<name>', require('./<name>'))` in `runners/index.js`. Requires a restart (no dynamic plugin loader yet).
- **New saved dashboard** → `POST /api/dashboards` or use `/dashboard/manage` (auth required). Default dashboards (`isDefault: true`) cannot be deleted.

## Security model (what to preserve when editing)

- **Env validation** — every `:ResultsEnv` route parameter MUST go through `middleware/validation.js#validateEnvironment`. This is the only barrier against path traversal in result-file lookups.
- **Auth gating** — when `config.session === true`, all mutating routes and dashboard pages use `middleware/auth.js#requireAuth`. Do not add new write endpoints without it.
- **Credentials** — `user`/`password` in `config/config.js` ship as `admin`/`password` for local dev. They MUST be changed via env vars before any non-local deployment (see `IMPROVEMENT_PLAN.md`).
- **No CSRF protection yet** — be aware when adding new POST/PUT/DELETE endpoints; document any new state-changing route in `IMPROVEMENT_PLAN.md` so it gets covered when CSRF is rolled out.
- **Error responses** — return through `middleware/errorHandler.js`; stack traces are exposed only when `NODE_ENV === 'development'`.

## Running & testing

```bash
node index.js              # start server (port 8080 or $PORT)
docker compose up -d       # containerised
npm run test:ui            # Playwright UI + Collections UI projects
npm run test:api           # Playwright API + Collections API projects
npm run test:supertest     # Mocha + Supertest
npm run test:bruno         # Bruno CLI (requires server running on 8080)
npx playwright test        # all Playwright projects (uses global-setup/teardown)
```

`tests/global-setup.js` spawns `node index.js` and waits up to 120s for the server; teardown sends SIGTERM. If a server is already on port 8080 it is reused.

## When fixing or extending

- Add validation at ingress (route handler) — don't trust runner names, env IDs, filenames, or query params from the client. Whitelist against the in-memory config.
- Keep the runner adapter contract stable; consumers' configs depend on it.
- New env vars must be documented in `README.md`'s "Environment Variables" section.
- New documentation files: cross-link from `README.md`'s Documentation list at the bottom.
