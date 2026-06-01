# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| latest  | ✓         |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email the maintainer directly (see package.json `author`) with:

1. A description of the vulnerability and its potential impact.
2. Steps to reproduce (minimal reproduction preferred).
3. Any suggested mitigations.

You will receive an acknowledgement within **48 hours** and a status update within **7 days**.

---

## Production deployment checklist

Before deploying outside of a local development environment, complete every item on this list.

### Authentication

- [ ] Set `session: true` in `config/config.js`.
- [ ] Set `ADMIN_USER` env var to your chosen admin username.
- [ ] Set `ADMIN_PASSWORD` env var to a strong, unique password (min 16 characters, mixed case + numbers + symbols).
- [ ] Set `SECRET` env var to a long random string (min 32 characters). Use `openssl rand -hex 32`.
- [ ] Set `NODE_ENV=production` — this enables `secure` and `sameSite: strict` session cookies.

### Transport

- [ ] Serve the app behind a reverse proxy (nginx, Caddy, etc.) with TLS/HTTPS.
- [ ] Ensure cookies are only sent over HTTPS (required for `cookie.secure: true` to take effect).

### Secrets

- [ ] Confirm that `.env` is **not** committed to version control (it is gitignored by default).
- [ ] Rotate `SECRET` and `ADMIN_PASSWORD` if they were ever exposed.
- [ ] If InfluxDB is used, set `INFLUXDB_TOKEN` to a scoped token (not an operator token).

### Dependencies

- [ ] Run `npm audit --audit-level=high` and resolve all high/critical findings before deploying.
- [ ] Pin dependency versions (`npm ci`) rather than `npm install` in deployment pipelines.

### Configuration API

- [ ] Restrict access to the `/api/config` endpoint via firewall rules if possible.
      The API strips `user`, `password`, and `session` fields, but network-level restrictions are an additional layer of defence.

### Filesystem

- [ ] Confirm the process user does not have write access outside the project directory.
- [ ] The results folder (`./results/`) should be writable by the server process only.

### Monitoring

- [ ] Use `GET /healthz` for liveness probes.
- [ ] Use `GET /readyz` for readiness probes.
- [ ] Enable `ExtendedLog: true` (in config) or forward stdout/stderr to a log aggregator for audit trails.
