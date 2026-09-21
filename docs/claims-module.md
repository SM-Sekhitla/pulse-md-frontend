# Claims module: preparation and corrections

This delivery adds **Finance → Claims** for practice owners and managers with Billing access. It uses the existing FastAPI/MongoDB backend and React frontend. It does not migrate storage or connect to SwitchOn.

## Available now

- Prepare a draft from an existing unpaid, non-void medical aid invoice.
- Open preparation from Billing's invoice detail.
- One draft per tenant/invoice, including repeated preparation requests.
- Tenant-specific, atomically allocated display references. Sequence gaps are acceptable.
- Server-side tenant scoping, Billing access and owner/manager permissions.
- Search and status filtering with 25-row pagination.
- Invoice snapshot, diagnosis and tariff details, integer-cent totals.
- Doctor-only draft corrections for membership, dependant, service date and diagnoses.
- Explicit diagnosis mapping for every tariff line.
- Validate the saved draft without overwriting corrections; detect changed invoice charges.
- Separately reload the invoice after confirming that draft corrections will be replaced.
- Append-only embedded activity entries and internal notes; optimistic revision checks prevent stale edits.
- Explicitly separate local preparation from delivery and assessment.
- No changes to invoices, patient balances or payments when preparing/validating claims.

Preparation statuses are `draft`, `needs_attention`, and `prepared`. **Prepared means local checks passed, not switch-valid or approved.** There is no submission API in this delivery.

## API

- `GET /api/v1/claims?q=&status=&page=1`
- `POST /api/v1/claims` with `{invoiceId}`
- `GET /api/v1/claims/{id}`
- `POST /api/v1/claims/{id}/validate` with `{revision}`
- `POST /api/v1/claims/{id}/notes` with `{revision,text}`
- `PATCH /api/v1/claims/{id}/draft` with revision and the permitted correction fields
- `POST /api/v1/claims/{id}/refresh-invoice` with `{revision}`

The server resolves the tenant from authentication. Request models reject additional fields. Events are appended atomically with the corresponding claim update. List responses omit events. A deterministic MongoDB document ID prevents duplicate drafts for an invoice; normal tenant/reference indexes are added during backend initialization.

Run isolated backend tests from the backend repository:

```sh
src/venv/bin/python tests/test_claims.py
```

## Remaining work

- Versioned clinical and tariff catalogues, provider identifiers and scheme-specific validation.
- SwitchOn adapter using official onboarding/API documentation, credentials, sandbox and confirmed capabilities.
- Durable submission attempts, idempotency, unknown outcomes, status callbacks/polling and retries.
- Membership checking and appropriately scoped cache.
- Remittance records, actual payment receipts, allocations, reversals and adjustment ledger.
- Confirmed patient liability workflows and reviewed statement sending.
- Scheme-specific deadline rules and background reminders.
- Role-specific preparation access for receptionists if enabled by product policy.
- Export, reporting and full audit-history pagination/retention as volume grows.

Do not infer scheme approval, money received, patient liability, universal deadlines or live switch connectivity from local validation. Existing Billing manual status controls remain manual records, now labelled accordingly.
