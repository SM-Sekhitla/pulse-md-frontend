# Medilink billing and claims integration

Status: implementation plan, updated 9 November 2026 after reviewing the XML workbook, onboarding screenshot and supplied seven-file XSD archive. All seven XSDs compile locally. No switch calls or financial submissions have been made. The screenshot supplies an assigned client identity and additional endpoint information; password availability, environment access and activation have not been verified. See the [schema review and resolved contract details](medilink-xsd-review.md).

### Phase 1 implemented

The backend now contains `src/app/integrations/medilink`: all seven original schemas and a SHA-256 manifest, schema-ordered request builders, protected XML parsing, per-operation response normalization, and synthetic contract fixtures/tests. The package README records operation coverage, field mappings, unresolved contract questions and usage. `lxml==6.1.3` is pinned in backend requirements and installed in the local backend virtual environment.

The 16 new contract tests pass offline, covering schema provenance/compilation, GP requests, membership, trace, reversal, financial precision, all four claim assessments, partial line messages, mixed batches, security limits and known response drift. Existing backend CI discovers these tests. No HTTP transport, API route, credential configuration, database migration or submission button is enabled by this phase.

Run from the backend root:

```sh
PYTHONPATH=src src/venv/bin/python tests/test_medilink_contract.py
```

The setup/authentication implementation is recorded below. The first patient-facing connected feature remains membership-number lookup. Trace/benefit response schema reuse and vendor contract disagreements remain explicitly pending.

### Phase 2 implemented: setup and sandbox authentication

Updated 10 November 2026: **Super Admin → Platform settings → Integrations** contains the Medilink panel, with an explicit practice selector. Practice accounts, including doctors and owners, have no integration screen, links, configuration responses or API access. Supplier BHF/HPCSA, active treating-doctor profiles, service location and scheme/plan routing remain scoped to the selected practice. Writes reject stale revisions and cross-practice references. Scheme mappings do not modify the shared medical-aid catalogue.

The backend adds `connection.py` and `settings.py` to the Medilink package. Its administration routes now live under `/api/v1/admin/integrations/medilink/practices/{tenant_id}` and require a super admin; the former practice endpoints are removed. Server environment credentials remain assigned by exact tenant ID. Token authentication uses HTTPS to the development host only, bounded response size, request timeouts, blocked redirects, memory-only token caching, expiry/rotation isolation and sanitized failure messages. Settings responses never expose credentials or tokens. A saved authentication test persists only status/time/actor/message; concurrent settings changes invalidate that result.

Practice BHF is required on registration/admin creation and must contain exactly seven ASCII digits, preserving leading zeroes. Profile/admin edits cannot clear or malform it, and approval/activation blocks legacy incomplete BHF records. Reads remain compatible with older records so they can be corrected. The admin practice detail page and pending queue expose the identifiers for manual review; the detail page allows BHF correction. No supplied switch endpoint verifies provider ownership or registry status, so this is format validation and manual approval, not automatic switch verification.

Backend example environment files document `MEDILINK_SANDBOX_CREDENTIALS_JSON`, `MEDILINK_SANDBOX_AUTH_ENABLED`, `MEDILINK_SANDBOX_BASE_URL` and `MEDILINK_SANDBOX_TOKEN_PATH`. The actual environment files have not been changed. Authentication defaults to disabled; no vendor endpoint has been called. See backend `src/app/integrations/medilink/SETUP.md` for deployment instructions and placeholder JSON format.

The 13 new setup/auth tests pass with HTTPX MockTransport/ASGITransport, alongside the 16 phase-one tests. Frontend TypeScript and production build pass. Existing backend CI discovers both suites. Development authentication acceptance still requires confirmed endpoint/version details and configured issued sandbox credentials; production, patient lookup, benefit checks and financial submission remain disabled/unimplemented as separate phases.

Run setup/auth tests from the backend root:

```sh
PYTHONPATH=src src/venv/bin/python tests/test_medilink_connection.py -v
```

The MQ membership vertical slice is implemented below. Benefit/submit request snapshots still need their additional patient, provider and service-line mappings.

### Phase 3 implemented: reviewed membership lookup

Patient registration and editing now offer scheme/member-number lookup, explicit authorization confirmation, a dependant picker and field-by-field reviewed autofill. No patient details change on lookup or selection alone. Apply updates only selected fields in the unsaved form; address/contact suggestions are unchecked initially because they may belong to the main member. Incomplete personal details remain manual, and unknown dates, IDs and genders are not invented. Input changes clear stale lookup results; a pending Apply cannot overwrite subsequent form edits.

Clinical endpoints live under `/api/v1/membership` and require owner/doctor/manager/receptionist access to the caller's own active practice and Patients module. They return clinical results and generic errors, with no credentials, BHF/routing configuration, raw XML, or vendor references. Super admins retain integration administration only.

Membership is disabled by default. A deployment administrator must enable backend `MEDILINK_SANDBOX_MEMBERSHIP_ENABLED`, configure issued credentials/authentication, and a super admin must enable `membershipLookupEnabled` for an explicitly designated sandbox test practice with supplier BHF and scheme routing configured. Use only vendor-issued synthetic memberships in the development environment. No actual switch requests were made while implementing this phase; vendor sandbox acceptance remains pending configured test access.

The backend serializes/validates MQ XML, verifies response client/request/member correlation, limits response bytes and timeouts, and refreshes authentication at most once for documented 401/501 rejection. It does not retry network timeouts or dispatch financial operations. Lookup outcomes and reviewed field names form patient-scoped history; sensitive suggestions are stored separately for 15 minutes with TTL and explicit expiry checks. Registration links reviewed history after a matching patient save. Review and lookup never write patient records or payment/claim state.

Automated tests use synthetic transport/API fixtures; browser checks verify selective autofill, preservation of unchecked contact fields, explicit Apply, stale review handling and changed-membership result clearing. ID-only lookup remains unsupported by the supplied XSD. Next is benefit checking, after vendor contract confirmation and additional charge mapping.

Reference: supplied *Medilink Switch Communication Specification v2.1*, including its May 2026 URL update, and nine supplied NetPractice screenshots. Examples in that document are reference payloads, not issued credentials or complete validation schemas.

Additional sources: supplied *Medilink XML.xlsx* (10 sheets covering claims, responses, reversal, trace, patient query and code appendices) and onboarding screenshot. Treat all attachments as contract evidence, not authorization to transmit credentials or patient claims. Do not copy access details from the screenshot into this repository.

## Start here

Build the server-side contract adapter and missing data mappings first. The first connected user feature should be **Check membership**, followed by **Check benefits** for selected draft charges. Then enable real claim submission, tracing and reversal through the same adapter. Keep the existing editable draft infrastructure, but remove preparation as the end of the product workflow.

Start with ordinary outpatient GP consultation/tariff claims. Defer dispensing, specialist, dental, optometry and injury-on-duty claim profiles until their additional fields are implemented and tested. A prescription is not automatically a dispensed-medicine claim.

Use XML as the initial proposed wire format because XSD validation can directly verify its structure, ordering and constraints. Confirm XML support for each operation with Medilink; keep the browser-facing API as JSON. Do not assume validating an XML equivalent proves a separately generated JSON request conforms.

## Product direction

Replace the preparation-only claims experience with a claims workbench connected to Medilink. Keep local validation as part of Review and submit, rather than making preparation the final workflow. Retain existing draft corrections, invoice links, tenant isolation and history.

The intended journey is patient → appointment/consultation → invoice charges → review and submit → switch response and corrections → tracing → payment allocation and reconciliation. Every claim should link back to its invoice, patient and appointment when one exists. Consultation and patient pages should open the same claim workflow without losing patient context.

### Patterns to borrow from the screenshots

- Claims list: patient, scheme, service/submitted dates, invoice, claimed amount, scheme-advised amount and outcome. Add search by patient, membership, invoice and claim reference; date/scheme/status filters; compact rows; useful empty states.
- Needs attention queue: missing membership/routing/provider details, rejected lines, unresolved submissions, and response warnings, with specific next actions.
- Claim detail: readable line-level amounts and messages, response history and a clear next action. Preserve submitted versions when correcting a claim.
- Reports: billed revenue, actual collections, outstanding balances, aged debtors and scheme reconciliation as separate measures.
- Provider settings: billing practice and treating practitioner identifiers; venue-specific details where needed. Restrict financial actions by role.

The screenshots' subscription Billing screen concerns the practice's software subscription, not patient accounts. Keep that separate from patient billing. Their payment links use a separate payment provider; they are not a documented Medilink capability. Borrow interaction patterns and information hierarchy, not branding, screenshots, copy or proprietary assets.

## Documented external operations

The communication document supplies five POST operations; the onboarding screenshot adds a sixth, benefit checking. PulseMD should call them from the backend only.

| Medilink path | Purpose | PulseMD entry point |
| --- | --- | --- |
| `/token` | Obtain a bearer token using issued credentials | Server-managed authentication; never a doctor-facing step |
| `/patients/query` | Find membership/dependants by membership and scheme in the supplied XML schema; ID lookup described in Word needs a compatible contract | Check membership during registration and claim review |
| `/benefitcheck/submit` | Check proposed charges using the normal claim request shape, per onboarding note | Check benefits from invoice/claim review before submitting |
| `/claims/submit` | Submit claim documents and tariff lines | Review and submit to Medilink |
| `/claims/trace` | Trace an existing switch claim reference | Refresh status; scheduled tracing where supported |
| `/claims/reverse` | Request reversal of a submitted claim | Restricted, confirmed reversal action with history |

The Word document describes ID-based searches across participating schemes, with only the most recent membership returned and membership taking precedence when both inputs are supplied. However, the supplied patient-query XSD requires MemberNumber and Option and has no IdNumber input. Start with membership-plus-scheme lookup; enable ID-only lookup only after obtaining a compatible contract. Let staff review results and select the correct dependant before applying changes. This does not establish universal eligibility, available benefits, or complete patient demographics.

The onboarding screenshot gives HTTPS benefit-check URLs for both development and live environments. Confirm response structure, supported schemes, fees, request-number rules and whether checks create external references or other effects before enabling it. Store checks separately from claim submissions. A positive check is not a claim approval or payment guarantee; display when it was checked and which charge revision it covers. Editing charges or membership makes the displayed check stale.

## Contract questions to resolve with Medilink

1. Confirm environments and HTTPS availability. Displayed development URL is `http://dev.medilinkapi.co.za`; displayed live URL is `https://live.medilinksa.com`, but embedded live hyperlinks target `https://live.medilinkapi.co.za`. Do not choose production from those conflicting examples. Use synthetic test records until secure test connectivity is confirmed.
2. Confirm that the issued client identity is enabled for development, and obtain the password through secure backend configuration. Obtain test BHF/practitioner details, the separate Medilink scheme list, test scenarios and production activation requirements. Never substitute the workbook's example test client for an assigned identity without vendor confirmation.
3. The supplied seven XSDs have been reviewed and compile without external imports/includes. Use the [schema review](medilink-xsd-review.md) for exact roots, ordering, mandatory fields and remaining disagreements. Detailed error dictionaries, scheme rules, corrected response field types and live schema compatibility still need confirmation.
4. Confirm versions: document revision 2.1 is distinct from resource media-type version `1.0b`; JSON patient-query samples also use payload Version `1`. Confirm each operation's required version.
5. Confirm token form encoding. The document prints `application/www-form-url-encoded; version=1.0b`; the standard form media type is `application/x-www-form-urlencoded`. Do not silently assume which header their server accepts.
6. Confirm duplicate detection, idempotency, correction/resubmission rules, and recovery after a timeout when no switch reference was received. Trace requires a reference; it cannot by itself recover every unknown submission.
7. Confirm result semantics and finality, reversal rules, rate limits and recommended tracing intervals. The document uses HTTP 501 for expired/unauthorised resource requests, unlike normal HTTP semantics.
8. The supplied schemas resolve XML trace naming to `RefNo` and reversal response naming to `ReveralReference`. Use these exact wire fields and normalize internal names. Obtain compatible examples for any live variant rather than mixing the workbook's alternative names into these serializers.
9. Confirm benefit-check response and lifecycle details from the new onboarding note. Ask whether ERA/remittance, scheme catalogues, attachments or webhooks have separate interfaces. The workbook lists financial/payment-advice fields, but no separate remittance endpoint has been supplied.
10. Resolve other document differences using the XSDs and vendor examples: patient-query ID input exists in the Word document but is absent from the workbook query sheet; Option length differs between query and claim; EchoType is limited to four characters in the workbook despite longer Word examples. The screenshot also prints HTTP token/submit URLs and a capitalized `/Token`, despite HTTPS URLs elsewhere. Confirm exact HTTPS URLs and case-sensitive paths before a connection test.

## Workbook findings and data backlog

| Source | Requirement/evidence | PulseMD implementation task |
| --- | --- | --- |
| Claim Send rows 8–21 | Provider discipline; unique ClaimNbr per supplier BHF; scheme Option; vendor/version; service location; item count; hospital indicator | Add a provider/venue profile and authoritative scheme routing map. Allocate claim numbers atomically per supplier, including across tenants if supplier identifiers can be shared. Preserve identifiers as strings. |
| Doctor types row 10; place appendix row 5 | General Medical Practice = 14; Consulting Room = 11 (12 means Home) | Offer labelled selections. Set values from the actual provider/venue profile, not copied example claims. |
| Claim Send rows 24–36, 192–211 | Supplier and treating BHF/HPCSA, with conditional referring/prescribing identifiers | Distinguish billing practice from treating doctor; add conditional profile validation. |
| Claim Send rows 50–65 | Member number/surname/initials; patient initials/name/surname/dependant/DOB | Split main-member name into usable fields; add reviewed membership/dependant selection. Preserve leading zeroes in dependant codes. Optional ID is not a universal submission prerequisite. |
| Claim Send rows 69–75 | Address components are marked optional | Add structured fields where useful; do not block the GP MVP on optional address collection unless a scheme rule requires it. |
| Claim Send rows 97–104 | Practice account/file reference, hospital setting and diagnoses | Reuse stable patient/account identity; map primary/other diagnosis levels; handle authorisation conditionally. |
| Claim Send rows 109–119, 155–189 | Line type, payment advice, tariff/description/quantity/units/unit type, treatment times, line diagnoses | Extend invoice/claim snapshots with stable line IDs and missing service metadata. Validate requirements by line type. Do not require Medicine/Modifier blocks on every tariff line just because their child fields are marked Y. |
| Claim Send rows 169–174, 219 | Medicine lines need NAPPI, dose/supply/type and applicable dispensing financials | Separate later dispensing profile; reject unsupported line types explicitly in the MVP. |
| Claim Send rows 45, 102, 107, 187 | Up to 10 Echo entries; 10 claim diagnoses; 100 items; 10 diagnoses per item | Compare limits with XSD cardinalities; return field-level errors, with no silent truncation. |
| Claim Response row 9 | FA = Full Acceptance; PA = Partial Acceptance; RV = Reversed; RJ = Rejected | Normalize assessment results with retained raw codes/messages. Unknown codes remain unresolved. Acceptance does not mean cash collected. |
| Claim Response rows 46–59 | DueByScheme, PaidToProvider/Patient, levy, exceeded benefit, rejected amount, tariff/payment advice | Store separate financial response fields. Workbook descriptions include amounts “to be paid”; reconcile with actual receipts before marking an invoice paid. Confirm contradictory PaymentDate description. |
| Patient Query / Response | MQ supported; PQ/IQ/BQ marked not yet available in query sheet; MF/NM are match/no match | Start with MQ. The newly supplied benefit endpoint is a separate operation, not permission to use BQ. Handle optional response contact/address/status fields when present without promising they will be supplied. |

The workbook is a field guide, not executable XML. It contains malformed-looking closing tags, inconsistent length/type notes and conditional fields. Schema validation plus vendor-accepted examples must decide serialization; record unresolved disagreements rather than silently choosing whichever document is convenient.

## Backend design

### Configuration and access

Store environment, confirmed base URL, ClientId, vendor identity/version and practice/provider settings in tenant-scoped configuration. Keep passwords and access tokens in protected backend storage or server secrets, with no values in VITE variables, browser responses, source control or ordinary logs. Clarify with Medilink whether credentials are per practice or vendor, then scope token caching accordingly.

Use the backend's existing HTTP client dependency. Separate transport, token management, operation serializers, response normalization and application workflows. Use returned token expiry rather than assuming the prose's seven days: the sample expiry differs. Handle documented authentication failures explicitly, with bounded re-authentication; do not put financial submissions in generic retry middleware.

### Data to map and validate

- Scheme: internal scheme/plan → authoritative Medilink Option/routing code.
- Practice and clinician: supplier versus treating BHF and HPCSA; provider type and service location codes from the contract.
- Membership: main member identity, membership number, dependant code, relationship and patient identity/demographics.
- Address: structured fields where required, rather than inferring reliable fields from a single free-text string.
- Claim: unique local claim number, service/created dates, account references, authorisation where applicable, diagnoses and Decimal financial totals.
- Lines: stable local line IDs, tariff, quantity, required units, service times, per-line diagnoses and amounts.

Do not use example provider, race, place-of-service or units codes as defaults. Required/optional fields must come from the confirmed schema. Preserve raw financial precision; handle decimal strings and numeric responses without binary floating-point calculations.

### Submission lifecycle

Persist a durable attempt and an immutable request snapshot before dispatch. Prevent simultaneous submission of the same revision with an atomic transition. Correlate request, invoice, claim and line identifiers; retain the returned switch and authorisation references. Persist redacted/appropriately protected raw responses alongside normalized results and audit events.

Separate three dimensions:

- Delivery: not sent, queued/sending, response received, outcome unknown, transport failure.
- Assessment: unassessed, accepted/rejected/partial/pending only when supported by authoritative result mappings; retain unknown raw codes without guessing success.
- Settlement: unpaid, partially paid, paid, derived from actual payment allocations.

HTTP 200 does not establish acceptance: inspect document and line messages. Submit input uses `Document`, whereas responses use `Documents`. Trace results nest headers under `ResponseHeader`; normalize this separately. Preserve warnings and line-level rejected/approved amounts. `DueByScheme` represents the response's scheme-advised amount, not a payment receipt.

For timeouts/disconnections after dispatch, mark outcome unknown and block automatic resubmission. Trace when a reference is available; otherwise use the vendor-confirmed recovery procedure. A local request ID/Echo is correlation, not proof of switch idempotency.

Reversals require explicit permissions, confirmation, concurrency protection and persisted attempts/results. A switch reversal is separate from invoice voiding and payment refunds. Corrections create a new version while preserving the original transaction and reference chain.

### Proposed internal API additions

These are PulseMD design proposals, not paths specified by Medilink:

- `POST /api/v1/claims/membership-query`
- `POST /api/v1/claims/{id}/benefit-check` with the expected local revision; creates a separate check record
- `POST /api/v1/claims/{id}/submit` with the expected local revision
- `POST /api/v1/claims/{id}/trace`
- `POST /api/v1/claims/{id}/reverse` with the expected local revision
- `GET /api/v1/claims/{id}/attempts`
- Restricted tenant integration settings and connectivity status, exposing no credentials

Keep existing draft/detail/correction APIs during migration. Expand role checks deliberately for doctors, reception and finance; do not grant submission/reversal permissions merely because a user can view a patient. Workers and all reads/writes must preserve tenant scoping. Keep clinical identifiers and credentials out of general diagnostic logs.

## Frontend changes

Replace the SwitchOn placeholder and preparation-only banner with truthful Medilink connection state. Before setup, show configuration requirements and disable submission; never simulate a sent claim. Retain drafts and integrate their validation errors into the review screen.

Use a claim detail drawer or page with patient/invoice links, service/provider/member details, editable draft lines, and a review-and-submit action. Show pending states during operations and specific errors via toasts plus persistent field/line explanations where correction is required. Avoid mapping every upstream error to invalid credentials.

After submission, show the persisted outcome, scheme messages, line results and references. Offer Refresh status, Correct claim and Request reversal only when appropriate to the confirmed lifecycle. An unresolved timeout needs a visible reconciliation action rather than an enabled Submit again button.

Keep billing collections based on the payment ledger. Do not mark invoices paid from a claim acknowledgement, `FA` example code, or DueByScheme. Remittance capture/import needs a separate design until an ERA interface is supplied.

## Delivery and verification

Implement in dependency order. UI and API contracts can be prepared offline; enable each external operation only after its contract and development access are verified.

| Phase | Deliverables | Acceptance / exit condition |
| --- | --- | --- |
| 1. Contract foundation | Inventory the supplied ZIP, schema versions/hashes/imports; create operation coverage matrix; XML serializers and response normalizers; synthetic fixtures; field mapping and unresolved-conflict register | GP sample validates against the actual request XSD; supplied responses validate/parse; required-field, order, cardinality and escaping failures are tested. Confirm which schemas cover membership, benefit, reversal and trace rather than assuming one pair covers everything. |
| 2. Configuration and data | Backend-only secrets; development/live separation; restricted integration settings; supplier/treating profiles; Medilink scheme mapping; extended patient/claim fields; token cache and transport | Settings expose only connection/credential-present status. Token retrieval works against confirmed development HTTPS using issued access. Cross-tenant access and token scoping tests pass; no secret appears in logs or frontend build. |
| 3. Membership vertical slice | MQ internal endpoint; registration/claim-review Check membership action; dependant picker; reviewed autofill; lookup audit/reference | Found/no match/vendor error/expired authentication tested; user can apply a specific dependant without silently overwriting patient data. Optional fields absent from responses remain optional. |
| 4. Benefit-check vertical slice | Shared claim-request builder with operation-specific numbering policy; separate benefit-check attempt/result; Check benefits UI with charge/diagnosis/member validation and per-line messages | Development request accepted using confirmed benefit response format. Results are timestamped and tied to immutable input revision. It does not mark the claim submitted, approve an invoice, or post a payment; edits make previous results stale. Confirm effects/fees with vendor before relying on read-only assumptions. |
| 5. Submission and claim detail | Durable attempts and dispatch/recovery mechanism; unique numbering; submit endpoint; atomic concurrency protection; normalized header/line results; claim workbench and detail timeline | Development full/partial acceptance and rejection cases pass; HTTP 200 rejection is shown correctly; duplicate clicks create one active attempt. Crash/timeout after dispatch becomes outcome unknown and cannot be blindly resent. Existing drafts/invoices retain IDs and history. |
| 6. Trace, correction and reversal | Reference-based tracing; configurable bounded polling; immutable correction versions with vendor-confirmed NW/RS rules; restricted reversal action and separate reversal attempts | Known claims can be traced and reversed in development; rejected reversals preserve original claim state. Reversal timeout is unresolved until reconciled. Polling survives restarts, respects rate limits and cannot create duplicate workers per attempt. Invoice void/refund actions remain separate. |
| 7. Release and reconciliation | Vendor acceptance scenarios; production configuration; feature flags per operation; alerts for overdue/unknown outcomes; role review; financial reconciliation UI | Vendor approval and agreed production activation completed. A controlled enabled practice can follow the complete journey. Actual payments require receipt evidence and allocations; scheme response amounts never create cash automatically. |

### First build batch

The next implementation batch should deliver phases 1 and the offline portion of 2, then finish phase 3 as the first connected feature:

1. Inspect the XSD ZIP and write the operation/field mapping with explicit gaps. Keep schema files in a versioned backend integration directory only if their distribution terms permit it; never bundle them into frontend assets unnecessarily.
2. Add the XML codec and contract tests with synthetic patients. Use a maintained XML library with XSD support (evaluate `lxml` against backend dependencies); disable external entities and network retrieval, resolve approved includes locally, and cap response size. Pin any new dependency and verify schema compilation in CI/container builds.
3. Implement a backend `medilink` integration package, keeping client/transport, authentication, XML codecs and response mapping separate from route handlers. Reuse the backend HTTP client. Add test doubles so CI never calls Medilink.
4. Add tenant configuration and provider/scheme mapping services. Define server secret names in the backend example environment without copying issued credentials; include environment, base URL, wire version, client identity, username/password or secret references, timeouts and operation enable flags. Do not make arbitrary caller-supplied URLs an integration setting.
5. Add authenticated membership-query API plus the reviewed dependant picker on patient registration and claim review. Return normalized data and useful field errors, not raw tokens or unrestricted vendor payloads.

Initial deliverable is a functioning membership integration in development, not another preparation-only screen. A schema-valid GP payload and shared codec then support benefit checks and claim submission without maintaining separate incompatible builders.

### Proposed persistence and indexes

Names are implementation proposals and may be adapted to existing MongoDB conventions:

- Integration configuration: tenant/environment/provider profile, scheme routing catalogue version and feature state; protected credentials separated from ordinary settings responses.
- Membership lookup: tenant, initiating user, patient when known, purpose, timestamps, result/ref and retained reviewed selections; minimize unnecessary raw demographic retention.
- Claim attempts: tenant, local claim/revision, operation, durable attempt ID, input snapshot/schema version, supplier and local claim number, dispatch timestamps, transport state, external references and protected raw/normalized results. Keep benefit and reversal attempts distinct from submission attempts.
- Timeline events: actor, operation, previous/new state and correlation IDs, with no credential values.
- Unique constraints: claim-number scope agreed with vendor; atomic one-active-dispatch rule per claim/revision/operation; indexes on tenant, outcome and next trace time. Do not use a sparse claimReference index as a substitute for submission concurrency protection.

Durable dispatch must distinguish an attempt never dispatched from one that may have reached Medilink. A worker lease expiring does not make resending safe. Implement recovery before enabling a queue/worker in production.

### UI and role acceptance

- Super Admin → Platform settings → Integrations → Medilink shows the selected practice's environment, missing setup fields and connection state. Credentials remain backend-only; no practice account has integration access.
- Patient registration and claim review provide Check membership with loading/error feedback and explicit dependant selection.
- Invoice/claim review provides Check benefits and Submit to Medilink as separate actions, with field-level corrections and button loading/duplicate-click prevention.
- Claims list offers patient/invoice/reference search and scheme/date/outcome filters. Claim detail shows assessment, financial advice, line messages and immutable history with patient/invoice links.
- Doctors and authorized billing staff receive specific view/query/submit permissions. Reversal and connection management have separate privileges. Server permission checks are authoritative.
- All operations preserve tenant and patient context. Errors/toasts complement persistent details for unresolved outcomes; a toast is not the only record of rejection or timeout.

Phase 1 now implements inventory, compilation, serializers, response normalization, the GP semantic-validation profile and synthetic fixtures/tests. No external endpoint tests or production activation have been performed. Inbound schema mismatches preserve an unresolved outcome rather than causing a blind financial retry. Sandbox acceptance remains a later integration milestone.

The user-facing implementation is still preparation-only in `src/routes/claims.tsx` and `src/services/claims.ts`, with backend routes in `src/app/route/claims.py` in the backend repository. The offline contract package does not yet connect those routes to Medilink or certify switch compatibility.


### Simple development connection test

Super admin → Platform settings → Integrations → select a practice → **Test connection**.
Only backend development credentials and `MEDILINK_SANDBOX_AUTH_ENABLED=true` are needed.
A new practice can test with settings revision `0`, without entering BHF, scheme routing,
or treating doctors and without creating billing settings. An existing practice tests its
saved wire version; unsaved edits do not affect the test. Connection results for a fresh,
unsaved profile are shown for the current page session only. Saved revisions retain their
existing connection-result history behaviour and revision-conflict protection.

Membership and claims settings are collapsed by default. Existing practice name, BHF and
HPCSA are prefilled where available; identifiers are never fabricated. Membership queries
still require an authorised BHF, a confirmed scheme Option mapping, backend membership
enablement and vendor-issued synthetic test membership. Authentication success alone
does not confirm membership lookup, benefit checking, claim acceptance or payment.


### Authentication compatibility correction — 12 November 2026

The token request now uses the literal Content-Type in Comms Spec v2.1:
`application/www-form-url-encoded; version=1.0b`. This vendor-documented spelling
differs from the standard form media type previously sent. Body fields remain
URL-encoded `grant_type=password`, `username`, and `password`; ClientId belongs
to operation payloads, not the documented token request. HTTPS and the configured
`/token` or `/Token` path remain enforced. No automatic header retries or sample
credential substitutions occur. Whether this resolves the observed development
rejection requires a deployment and an explicitly triggered connection test.

The super-admin connection test reports the upstream HTTP status and a known
OAuth error code when returned as JSON. Vendor descriptions, unknown codes and
raw bodies are discarded. HTTP 400 is identified as a request rejection, HTTP 415
as a Content-Type rejection, and 401/403/501 as authentication/access rejection.
These diagnostics distinguish failure classes without claiming a specific root cause.
