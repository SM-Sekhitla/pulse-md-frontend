# Super-admin system logs

Open **Super Admin → System logs** (`/admin/logs`). This is an operational log-file browser, separate from the existing Audit log.

- Browse folders, including `modules` (auth, patients, invoices, appointments and other modules) and `services` (email, image processing and scheduler).
- Filter folder names, open a log or numbered rotation, and preview the newest 100–2000 lines.
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
