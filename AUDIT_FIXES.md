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
