# Audit fixes — November 5, 2026

Each issue is fixed and committed separately, in audit order.

## A1 — Enquiry delivery

Fixed: queue EmailJS requests at least one second apart, coalesce identical
submissions on the current page, and treat any confirmed recipient delivery as
success. Removed the artificial timeout that could report failure while sends
were still running. A complete delivery failure remains retryable. The request
carries a stable lead ID. Cross-device or server-side deduplication would need
a service endpoint and is not claimed by this frontend change.

Validation: mocked delivery tests cover both site versions, rate spacing,
duplicate calls, partial success, and total failure; no real emails are sent.

## A2 — Regional details and language controls

Fixed: international Russian content now consistently names Datvida LLC and
uses USD budgets, matching its pricing, contacts, and scope. Restored the
desktop language toggle and added a mobile language button on all ten pages.
A late geo-IP response no longer overrides a manual language choice.

Validation: both mobile language controls and international Russian identity
and pricing regression checks passed.

## A3 — Preserve the project brief

Fixed: retain note, name, contact, step, and choice keys in a regional session
draft. Closing, language changes, and navigation restore the draft. Submitted
forms are not rebuilt while sending. A reset or confirmed send clears the draft.

Validation: close/reopen, language switch, reload, and reset pass on both sites.
