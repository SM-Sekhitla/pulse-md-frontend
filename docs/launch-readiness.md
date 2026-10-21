# PulseMD pilot deployment and operations

Code changes support a controlled pilot; production configuration and live acceptance still need verification. Do not describe claims switching, browser dictation, equipment tracking, or automated reminders as guaranteed production services.

## Deploy together

Deploy the frontend and backend from the same tested change set. The patient directory exports the filtered patient list as CSV, with spreadsheet-formula escaping.

Frontend CI runs TypeScript checking and a production build. Backend CI runs regression tests. Both publish an immutable commit tag as well as `latest`; retain the prior commit tag for rollback.

Set the frontend GitHub repository variable `VITE_API_TARGET` to the backend HTTPS origin (no `/api/v1` suffix). The browser uses `/api/v1` through the frontend proxy. Configure the optional `VITE_GEOAPIFY_API_KEY` GitHub secret to compile address autocomplete into the image. Set Docker Hub variables/secrets and the Render deployment-hook secret for each repository. A failed deployment hook now fails the workflow.

Set backend Render environment variables from your existing secure configuration, including MongoDB, authentication, email, frontend URL and CORS settings. Also set:

- `DOCUMENT_KEY_ENCRYPTION_SECRET`: a stable Fernet key, stored separately from database backups. Generate a key on a trusted machine with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`. Do not paste it into chat or commit it.
- `BACKUP_ENCRYPTION_KEY`: a different generated Fernet key for encrypted backups.

Missing local development keys were generated in the ignored backend `src/.env` without displaying them. If local and Render services use the same database, use the same document-key encryption secret in both; do not generate a different secret after keys have been stored.

Do not rotate either encryption key casually. Losing the document key secret prevents use of stored signing keys. Losing the backup key prevents restoration. Store recovery copies in the organisation's secret manager, with restricted access and an accountable recovery owner.

## Preserve older document verification

Before replacing the existing backend host/container, preserve its legacy `keys/tenants` directory and run from the existing backend source directory:

```sh
PYTHONPATH=. python scripts/migrate_signing_keys.py
```

The script uses `DOCUMENT_KEY_ENCRYPTION_SECRET` and the configured database to import local signing keys into encrypted database records. Run it where the existing keys actually reside; configure `DOCUMENT_KEYS_PATH` if necessary. Verify an old prescription and sick note before and after redeployment. If old key files have already been lost, this change cannot recover them.

New signing keys are stored encrypted in MongoDB. Private patient attachments already reside in the database. Any other local image/video storage still requires persistent storage or an explicitly configured cloud provider.

## Backups and restoration

Backend `.github/workflows/backup.yml` provides manual and daily encrypted backups. Configure the backend repository secret `BACKUP_ATLAS_URI` with the necessary backup permissions, variable `DB_NAME`, and secret `BACKUP_ENCRYPTION_KEY`. The encrypted artifact is retained for 14 days by that workflow. Confirm the schedule is running and configure an approved longer retention destination if needed.

From an operations environment with `pymongo` and `cryptography` installed:

```sh
python src/scripts/backup.py backup --file pulse-backup.enc
python src/scripts/backup.py restore --file pulse-backup.enc --target-db pulse_restore_drill
```

Supply connection settings and the backup key through the environment. Restoration authenticates the archive before writing, requires an empty target database, and rejects restoring into the configured source database. A database restore does not automatically recreate indexes; run application index initialization against the restored database before testing or switching traffic. Inspect restored patients, consultations, files, receipts and encrypted signing keys using a separate staging backend. Record the restore time and result. Never run acceptance tests against real patient data in an unsecured development environment.

## Monitoring and support

Configure an external uptime monitor for backend `/health/ready` and frontend `/healthz`, plus an actual browser login smoke check on the deployed domain. Backend readiness checks database connectivity and signing-key configuration; it does not certify switch/email/transcription providers. Alert the named operations owner for failed backups, repeated server errors and prolonged outages. Test the alert delivery.

Collect request IDs, failure time, affected workflow and browser/version in support tickets. Avoid sending patient records, PINs or credentials in ordinary email/chat. Define an on-call contact, response expectations, incident communication and key/PIN recovery procedure before onboarding clients. Lost signature PIN recovery requires an independently verified account-owner support process; this release does not silently bypass or reset PINs.

## Pilot acceptance

Use a dedicated staging practice with owner, employed doctor and receptionist accounts. Verify:

1. Practice settings and working hours survive reloads; public booking respects closures, breaks, slot duration and existing bookings.
2. Reception registers a child without a personal email/ID, records consent and emergency details, and edits demographics. Two family members may share an email.
3. Reception books, reschedules and checks in; separate doctors can book at the same time in different rooms; simultaneous conflicting requests cannot both reserve the same resource.
4. A clinician starts a consultation, types notes, verifies autosave/reload, uploads an attachment, issues a PIN-protected prescription and sick note, and completes the visit. Wrong PINs and receptionist issuance are rejected.
5. Completion opens the patient profile. Completed clinical notes stay unchanged; corrections appear as dated addenda.
6. A private invoice accepts partial payment and full settlement. A medical-aid invoice accepts payer-specific payments. Repeated request IDs do not duplicate a payment. Refunds create separate entries and receipts; overpayments and excessive refunds are rejected.
7. Two practices cannot read each other's patients, documents, consultations, invoices or keys. Suspended practices lose API access. Public directory responses contain only public booking fields.
8. A backend restart/deploy preserves old and new document verification. A backup restore drill succeeds in an isolated database.

Recorded payment totals from older invoices are preserved as an opening scheme balance; reconcile those balances before the pilot. They are not converted into invented historical receipts.

## Explicit product limits

Claims support draft preparation and local validation; live transmission, eligibility checks, remittance import and insurer reconciliation require a contracted switch integration. Audio recording and editable text notes are available; live dictation uses the browser's speech service and requires a browser/provider acceptance test. Automated reminders and equipment management are not enabled. Unimplemented report cards and sample equipment records have been removed from the usable navigation. Existing reports describe billed amounts, not guaranteed cash received.
