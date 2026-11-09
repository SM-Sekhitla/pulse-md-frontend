# Medilink XSD review

Reviewed 9 November 2026 from `XSDs-20261109T211652Z-1-001.zip`. This is contract analysis for the [implementation plan](medilink-integration-plan.md), not a live integration or vendor certification. Archive contents were extracted to a temporary directory only; no vendor schema files or access details were added to application assets.

Implementation update: phase 1 now preserves the seven schemas and their manifest in the backend integration package (not frontend assets). Request/response codecs and synthetic offline tests implement the requirements below; unresolved vendor conflicts remain explicit. No access details or live traffic were added.

## Inventory and verification

All seven schemas are well-formed and compile with the locally available libxml2 XML Schema compiler. None declares a target namespace or an XSD import/include. Compilation establishes that the schemas are usable; it does not prove that live responses conform or that any operation is enabled for the issued identity.

| File | Root | Intended coverage |
| --- | --- | --- |
| `request-v1.1.xsd` | `Claims` | Claim submission request; benefit-request reuse is stated in onboarding, but endpoint compatibility still needs verification |
| `response.xsd` | `Response` | Claim response; confirm reuse for trace and benefit responses |
| `request-patqry.xsd` | `Request` | Membership query request |
| `response-patqry.xsd` | `Response` | Membership query response |
| `request-traces.xsd` | `Traces` | Trace request |
| `request-rev.xsd` | `Claims` | Reversal request |
| `response-rev.xsd` | `Response` | Reversal response |

There is no separately named benefit-check or trace-response schema, token schema, or example XML in the archive. The filename `request-v1.1.xsd` does not specify a wire Version value: its Version element accepts a nonempty string of up to four characters. Confirm the vendor-required version instead of sending `1.1` based on a filename.

## Confirmed serialization details

- XML elements use ordered `xs:sequence`: top-level `Version` precedes `ClientId`. Follow each schema's order rather than copying JSON property order from the Word examples.
- XML response documents are singular repeated `Response/Document`, with `ResponseHeader` inside each document. Word JSON uses `Documents`. Maintain separate format-aware codecs.
- Trace: `Traces/Document/RefNo`, then `BhfNumber/Supplier`. RefNo permits up to 36 characters. Do not serialize the workbook's `ClaimReference` element for this supplied XML schema.
- Reversal response: `Response/Reversal/ReveralReference` is the actual optional element name, including the typo. Map it to a correctly named internal field while retaining the raw response. A differently spelled live response should be recorded as contract drift rather than silently changing the original schema.
- Claim line practitioner block is `HpcNumberItem`, not the Word JSON example's `HpcItem`.
- Claim requests use header financial `CoPay` and item financial `Copay`; response member financials use `ReferenceSurcharge`. Preserve exact case/spelling per operation.
- Request EchoType is up to 30 characters on claim headers/lines, but only four on membership/reversal requests. Use operation-specific identifiers; do not apply one global length rule.
- Claim and reversal requests allow 1–99 documents/reversals; claim lines 1–100; claim diagnoses 1–10; line diagnoses 0–10. MVP should dispatch one claim per attempt while preserving future batch parsing.
- Claim results are restricted to FA, PA, RV and RJ. Claim response types include NW, RS, BA, SF, SR, DA and ER. Retain the raw type; get authoritative meanings and transition rules before assigning finality.

## GP profile: what is actually required

The claim schema requires header identity/routing/vendor fields, supplier and treating BHF, created/service dates, member number/surname/initials, patient initials/name/surname/dependant/date of birth, total, account number/setting, at least one claim diagnosis and at least one item.

Each item requires its header (number/type/payment advice), treatment dates/times and financial total. Procedure, Modifier and Medicine blocks are structurally optional independently; the schema does not enforce selecting the block appropriate to the line type. PulseMD must enforce business rules such as Type 1 requiring Procedure, valid tariff/units and consistent totals, even if an incomplete payload technically validates.

Notable differences from the workbook:

- `HpcNumber` is optional in the claim XSD; when included, Supplier is required and Treating is optional. Keep HPCSA/provider validation as a separately documented business/profile rule until Medilink confirms requirements.
- Address is optional, but Line1 is required when the block is present. Omit an unused optional block rather than serializing empty placeholders.
- Patient Gender, Relation, NewBorn and Race are optional. Omit optional values that have not been captured; do not invent them from example claims. Request Race allows A/B/C/W/I, whereas the claim response's optional Race enumeration omits I: record this response-contract difference for vendor clarification.
- Line diagnoses and line provider blocks are optional structurally. Continue explicit local diagnosis mapping and treating-provider validation as product/business rules.
- Dependant is an integer in the claim request, but a string in membership responses. Preserve the original displayed code such as `00` internally and avoid losing it through numeric storage. Postal is also numeric in the claim request; retain the original address representation internally.
- Many required strings allow empty text because only maxLength is constrained. Date patterns can allow impossible calendar dates such as 31 February. Numeric fields do not universally prohibit negative amounts. Add semantic validation for required values, real dates, valid treatment intervals, supported codes and consistent amounts.

## Membership lookup scope

`request-patqry.xsd` requires Version, integer ClientId, Query RequestType/RequestId, exactly seven-character BHF, MemberNumber and a 1–4 character Option. **There is no IdNumber request element.** Start with membership-number plus scheme lookup. Do not offer ID-only lookup through this XML serializer until Medilink supplies a compatible schema or confirms a separate JSON operation/version.

The XSD enumerates MQ/IQ/PQ/BQ, but the workbook says only MQ is available. Schema enumeration is not evidence that the other operations are enabled. Use MQ for the first release; benefit checking remains the separately supplied endpoint.

Response results enumerate MF/NM, while the Word examples also show NA. A live NA response would be schema drift, not a proven no-match result. Record the raw code and surface an unresolved lookup with useful messages. Most dependant demographics are optional in the response XSD, so the picker must work with incomplete results and must not assume DOB or ID will always be returned.

## Vendor clarifications that remain necessary

1. Confirm schema version and accepted media type for each endpoint, including benefit and trace responses, exact HTTPS URLs/path casing, development credentials and test records.
2. Resolve response financial definitions: `PaymentMethod`, `ReasonDescription`, `ReasonCode` and `PaymentDate` are typed as `xs:decimal` in scheme financial blocks. The workbook describes textual CHQ/EFT payment methods and descriptive reasons. Do not parse these fields universally as monetary values or modify the supplied XSD to hide the conflict. Request corrected response schemas and accepted sample payloads.
3. `response.xsd` restricts Process to a 20-character string; verify real timestamp formats. Its Date block lacks the Word trace examples' AckDate/ConfirmationDate. Confirm how trace acknowledgements are actually returned.
4. Confirm ID-only lookup, NA/other result codes, correction/resend rules, transport-error recovery, unique claim-number scope and external reference lengths. Schema maximum lengths differ from workbook notes in several places.
5. Provide the separate Medilink scheme list, supported benefit schemes and response semantics/fees. A valid XSD does not supply routing catalogues, entitlement, benefit guarantees or remittance capabilities.

## Implementation consequences and checks

Proceed with local XML codecs, secure backend configuration, GP semantic validation and membership-number lookup. These no longer depend on receiving the base XSD files. Keep missing contract details as operation-specific enablement gates rather than blocking all offline development.

Validate outbound XML strictly before dispatch. For inbound schema failures, preserve the protected response and validation diagnostics, return a controlled contract-mismatch result and avoid automatically applying financial/clinical state. For a dispatched claim whose outcome cannot be normalized, mark the outcome unresolved; an invalid response is not proof the claim failed and must not trigger an automatic resend.

Contract tests should cover ordered XML, escaping, optional-block omission, exact tag case, length/cardinality limits, membership no-match/incomplete dependants, all four claim results, request-level rejection with no Document, partial line outcomes and ReveralReference. Add explicit drift fixtures for NA, textual payment method, trace date variants and unknown enums. Add business-validation tests for empty required strings, impossible dates, invalid treatment order and amount inconsistencies that the XSD does not catch.

## Archive fingerprints

SHA-256 fingerprints identify the exact reviewed files for comparison with future vendor updates:

```text
request-patqry.xsd  6922659dd6c630d1f9231434c5bfff979e630e8ee4c05a053d67bc4f6c318090
request-rev.xsd     9cf19ec915abe4b27c3a470ddb9ea4ac544608f9e422ce317e1b4bd0c5b2cef9
request-traces.xsd  bc351430c5359dfd4f6b122c3e4b259bf985fe996225b45f494fceef46a4c1cd
request-v1.1.xsd    0221dd583c2b5f70d525f97ea84e980372340d0f35e0df8a7cc09d479eb9af82
response-patqry.xsd 565cd1552ed8240e5402badf6df79f24634950b8f40301a3bf7d6488a08b8256
response-rev.xsd    287688b92643a660cf3e213540bcf2f2a5017180d4786610517b7f61f7386707
response.xsd        e41ef1e8a8a56682e51300f28eb74ac3b55e5bda14cc3d82435676e889561195
```
