# Super-admin system logs

Open **Super Admin → System logs** (`/admin/logs`). This is an operational log-file browser, separate from the existing Audit log.

- Browse folders, including `modules` (auth, patients, invoices, appointments and other modules) and `services` (email, image processing and scheduler).
- Filter folder names, open a log or numbered rotation, and preview the newest 100-2000 lines.
- Search and severity-filter the loaded preview; these filters do not search the full file. Continuation lines without a severity label are excluded when a specific severity is selected.
- Refresh manually or enable five-second preview refresh while the page is active.
- Download a redacted text file. Preview reads are capped at 256 KiB; downloads at 8 MiB. Oversized downloads return a useful error rather than loading an unbounded file.

All log-browser and legacy log endpoints require a super admin. Practice owners, doctors, managers, receptionists and nurses are denied by the backend. Paths are relative to the backend log root; non-log files, traversal, symlinks and non-regular files are rejected. The UI displays text safely rather than rendering log content as HTML.

Common password/PIN/token/API-key patterns, bearer tokens, database URIs and email addresses are redacted in previews and downloads. This is best-effort redaction, not complete removal of patient information from free text. Source files remain backend operational records; avoid logging clinical bodies or credentials in the first place.

API under the existing `/api/v1/logs` prefix:

- `GET /browser?path=modules`
- `GET /preview?path=modules/auth.log&lines=300`
- `GET /download?path=modules/auth.log`

Legacy list/read/tail routes remain available to super admins and now use bounded, redacted reads. Existing module logger names are retained, with files grouped beneath `modules/` or `services/`. Root-level legacy logs remain visible, including rotated `.log.1` files.

Logs come from the backend instance handling the request, not from Docker's daemon or Render's external log service. File history needs persistent storage or a central log sink to survive container replacement and support multiple instances. A local update can preserve existing files under a dated history folder; it is not a production retention system.

Run offline tests from the backend repository:

```sh
PYTHONPATH=src src/venv/bin/python tests/test_system_logs.py -v
```

## What gets logged

Every backend log line has the form `[time] [LEVEL] [logger] [request id] [actor=.. tenant=.. role=.. src=..] message`. The bracketed context is filled from the request's bearer token and is empty for start-up and background work.

| File | Contents |
|---|---|
| `errors.log` | Every WARNING and above from every logger, in one place |
| `modules/activity.log` | Every create, update and delete made through the API: who, which route, the status, and whether it was done, refused or failed. Request bodies are never logged |
| `modules/client_errors.log` | Errors thrown in the browser, reported by the web app (`POST /api/v1/client-errors`) |
| `modules/claims.log`, `consultation.log`, `medilink.log`, `public_booking.log`, `signature.log` | Domain events and Medilink calls: tenant, ids, timing and outcome. Never member numbers, XML or clinical text |
| `services/lifecycle.log` | Start-up facts (version, environment, integrations), shutdown, and a health line every 5 minutes: uptime, memory, database latency, event-loop lag and request counts |
| `services/database.log` | Database commands slower than 0.5 s, and failed commands |
| `services/security.log` | Rate limits and brute-force blocks |
| `services/upload.log` | Image uploads and rejections |

Slow requests (2 s or more) are logged at WARNING, 5xx at ERROR, 401/403/429 at WARNING, and health probes at DEBUG.

Environment: `LOG_LEVEL` (default INFO), `LOG_LEVELS` for per-logger overrides (`auth=DEBUG,email=WARNING`), `LOG_BACKUP_COUNT` (default 20 rotations of 10 MB), `SYSTEM_HEARTBEAT_SECONDS`, `SLOW_COMMAND_SECONDS`.

## Using the viewer

Each entry is split into time, level, logger, request id and context. Click a request id to filter to every line for that request. Level chips show counts and toggle levels; "Problems only" keeps warnings and errors. Stack traces stay attached to the error that produced them when you filter. The view can be copied or downloaded as filtered. The empty state links straight to the errors, start-up, activity, security and browser-error logs.
