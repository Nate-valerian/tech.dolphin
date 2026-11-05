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

## A4 — Repair mobile navigation

Fixed: menu overlays fit the dynamic viewport, scroll on short screens, and
wrap long contact labels. Crossing the desktop breakpoint closes and restores
the menu. Scroll locking is guarded, and Escape outside a menu does not jump
to the top.

Validation: both sites pass 320px close/scroll and desktop resize regressions.

## A5 — Fit the brief to short screens

Fixed: mobile briefs use a sheet constrained to the visual viewport, with a
fixed header and a scrolling body. Visual viewport resize/scroll updates keep
controls visible when the keyboard opens. The open sheet sits above the
cookie notice, with an accessible close control.

Validation: 320px-wide, 568px and 300px-high viewport checks pass on both sites.

## A6 — Keyboard access and understandable forms

Fixed: FAQ buttons expose expanded states, pricing uses native checkboxes,
all enquiry fields have persistent labels, and sending/error/success feedback
has accessible states. Added one main landmark, a skip link, and primary
headings. Modal menus move/trap/restore focus and make the background inert.
Brief steps preserve focus and Escape closes the brief.

Validation: keyboard interactions, modal focus cycling, field labels, headings,
and the existing smoke checks pass for both versions.

## A7 — Connect pricing to the enquiry

Fixed: selected services persist through navigation and appear as an editable
summary and message prefill on Contact. The submitted enquiry includes its
selected service names and regional starting estimate. Visitors can edit or
clear selections; language changes preserve their extra requirements.

Validation: service selection, navigation, message preservation, and clear
behavior pass for both currencies.
