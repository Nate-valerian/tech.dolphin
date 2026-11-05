# Changelog

## 2026-11-05 — Publish the international site to Netlify

Published source commit `7f6157d` to the existing `nate-web3` production site at
https://nate-web3.com. Netlify confirmed deployment
`6aece858651d13cf21fb847a` as ready and published at 23:34 Europe/Moscow.
Deployment details: https://app.netlify.com/projects/nate-web3/deploys/6aece858651d13cf21fb847a.

Live verification passed for all five pages and ten clean/trailing-slash aliases,
including query preservation. SHA-256 hashes of the deployed stylesheet and all
five JavaScript files match the checked international build. The source's 37
tests had passed before publication.

## 2026-11-05 — Repair international URL aliases and translated metadata

Clean URLs such as `/projects` previously caused the language script to replace
the page's title and social metadata with the homepage values. Page detection
now accepts both clean URLs and `.html` URLs. Generated Netlify redirects bring
clean and trailing-slash aliases to the existing canonical `.html` pages,
preserving queries and keeping relative assets and navigation valid. Netlify's
Pretty URLs setting is explicitly disabled to match that URL format.

Validation: reproduced the metadata failure before the fix; browser regressions
cover all four inner pages in both languages and all five page aliases with
and without trailing slashes. Redirects ship only in the international output.
All 37 tests pass. Both deployment ZIPs were rebuilt and verified by exact file
name, size, and SHA-256 hash (42 files each). Changes remain local and committed.

## 2026-11-05 — Correct the international Netlify publish output

Added tracked Netlify settings that build and publish `dist-international`
instead of the repository root. The portable Node staging command checks the
generated sites and copies only international public files. Windows deployment
ZIPs reuse that allowlist. Added a dedicated international packaging command
and documented Git-based and manual Netlify workflows.

Validation: the international build and four deployment/source regression
tests pass, including a build with PowerShell unavailable and exact comparison
of the staged international files. No site was published.

## 2026-11-05 — Complete the project audit fixes

Addressed audit items A1–A17 in separate commits. Fixes cover enquiry delivery,
regional business details, draft preservation, responsive and keyboard access,
connected estimates, analytics permission and tracking, metadata, storage
fallbacks, media loading, translation coverage, deployment integrity, and dates.
Both sites now build from shared templates, behavior, and explicit regional
settings. See AUDIT_FIXES.md for the issue-by-issue validation and commit index,
and DEVELOPMENT.md for the source and build workflow.

All 34 tests and 100 browser layout/language states passed. Both deployment ZIPs
were rebuilt and verified by file name, size, and SHA-256 hash. Changes remain
local: committed, but not pushed or deployed.

## 2026-11-05 — Give the headline a more positive tone

Replaced the 30%-below-market comparison with "and built to help your
business grow" and matching Russian wording. Updated the About message in
both site copies to emphasize a fast launch, thoughtful work, and business
growth. Refreshed translation asset versions and the drift baseline.

Verified both languages on both sites at desktop and mobile widths (8 browser
checks), with no remaining discount comparison or horizontal overflow.

## 2026-11-05 — Refine the site color palette

Updated both the Russian site and `netlify-abroad/` with warm off-white
backgrounds, charcoal text, white cards, and a muted ocean-blue accent.
Replaced bright cyan gradients, colored glows, shimmer effects, and pulsing
shadows with flat colors and softer neutral shadows.

Applied the same palette to navigation, mobile menus, forms, pricing selections,
chat, cookies, and privacy text in both languages. Replaced hardcoded inline
colors with shared CSS tokens, refreshed browser theme colors, and bumped asset
versions so returning visitors receive the new styles and translated markup.

Validation: all 6 existing Playwright tests passed. Browser checks covered all
10 pages at 390, 1024, and 1440px, including menu colors, selected pricing cards,
typed form text, and translated privacy headings; no horizontal overflow or
JavaScript errors were found. Primary button text contrast is 7.12:1; muted
placeholder text against input backgrounds is 4.69:1. Desktop and mobile preview
screenshots are saved under `test-results/color-review/` (ignored by Git).

Prepared locally for review and deployment; this palette update has not been
pushed or deployed.

## 2026-08-01 — Follow-up audit, fixes, and deploy-zip bug

A second full review turned up 6 weaknesses, fixed one by one, plus 3 more
issues reported directly and fixed the same way. All 9 commits are on `main`
but **not yet pushed to `origin/main`** and not yet deployed — the rebuilt
deploy zip is sitting at the repo root ready for manual upload to spaceweb.

1. **`511459b`** — Activate geo-language detection on netlify-abroad
   `applyLang()` hardcoded its `lang` argument to `'en'` regardless of what
   was passed in, `toggleLang()` always passed `'en'`, and
   `initGeoLanguage()` called `applyLang('en')` outright — so the IP-geo
   detector (`fetchCountryCode`/`detectGeoLang`, hitting `ipapi.co` and
   `geojs.io`) and the manual-override persistence (`getManualLang`,
   `LANG_MANUAL_KEY`) were fully wired up but never influenced anything.
   Every visitor got English, and the site made two geo-IP network calls
   per pageview for nothing. Now `applyLang()` respects its argument,
   `toggleLang()` toggles and persists the manual choice, and
   `initGeoLanguage()` only runs the geo lookup when no manual override is
   stored.

2. **`9e6b11e`** — Add drift-detection check between techdolphin.ru and
   netlify-abroad
   The two site copies share no build step — every fix has to be
   hand-ported to both `main.js`/`i18n.js`/`analytics.js`/`style.css`,
   which is exactly how the mobile-nav z-index bug, the honeypot gap, and
   the light-theme pricing regression (2026-07-31 items 5–9) each missed
   one side for a full audit cycle. `scripts/check-drift.js` snapshots
   `git diff --no-index` between each forked pair and fails if the current
   diff no longer matches the snapshot, so a one-sided edit gets flagged
   for review instead of shipping unnoticed. Wired into `pretest`; `npm run
   check-drift -- --update` accepts an intentional, already-ported change.

3. **`f6a98b5`** — Compress oversized media assets shipped to visitors
   Checked every video/image's actual pixel dimensions and bitrate against
   the CSS box it renders into before touching anything, frame-sampling
   before/after to confirm no visible quality loss. `logo.video.mp4` (nav
   logo, displayed at 36–110px) was 1112×834 @ 60fps/7Mbps — cut to 168KB
   from 4.3MB. `dom-short-01.mp4` 988KB→264KB, `domspace.mp4` 4.5MB→1.4MB,
   `perfume-product-5s.mp4` 2.4MB→104KB, `dom-space-web.png` 1.6MB→244KB.
   `ai-business-assistant.png` had no alpha channel (confirmed via ffprobe)
   so it was the wrong format for a photo; converted to `.jpg` at the same
   resolution, 260KB→68KB, updating the 4 `<img>` references across both
   site copies. Skipped `dom_video.mp4` and `logo_video.mp4` — re-encoding
   didn't beat their existing size.

4. **`20a319b`** + **`d4f504f`** — Flag suspiciously fast lead-form
   submissions in analytics
   The honeypot only catches bots that fill in a hidden field; a scripted
   submit that skips the fill-in delay entirely gets through it. Added a
   `fast_submit` boolean (submitted under 1.5s after page load) to
   `trackLeadResult` on the callback and contact forms, on both site
   copies — analytics-only, never blocking. A first pass tried silently
   blocking fast submissions like the honeypot does, but that risked
   discarding real leads from browser autofill with no error shown to
   anyone; reverted to flag-only before committing. Left the chatbot form
   alone — it was never wired into analytics (no `id`, no goal mapping)
   and adding that is a separate decision. `ANALYTICS.md` documents the
   new parameter.

5. **`3d53877`** — Add preconnect hints for Google Fonts
   Neither `fonts.googleapis.com` nor `fonts.gstatic.com` (the CSS host and
   the actual font-file host it points to) were discovered until the
   browser parsed the `<link>` tag. Added `rel="preconnect"` for both
   across all 10 pages (5 per site copy) so the connection handshake
   happens in parallel instead of adding to the critical path.

6. **`fd5a6cf`** — Fix duplicate video tile in the hero media grid
   Reported directly: the desktop 2×2 hero-media-grid on both site copies
   played `dom-short-01.mp4` in two of its four tiles — a copy-paste
   leftover, visibly the same clip looping twice side by side. Removed the
   duplicate, leaving the 3 distinct clips, and had the CSS grid span the
   third tile full-width instead of leaving an empty cell in the last row.
   Found and fixed the identical duplicate in netlify-abroad's separate
   "DOM Immersive Media" project card (root has no equivalent section),
   replacing the repeated clip with `dom_video.mp4` so its 3-column grid
   keeps 3 distinct clips. Verified both breakpoints with Playwright
   screenshots before and after.

7. **`bf14140`** — Fix mangled em-dash text and cookie banner covering the
   chat launcher
   `index.html` and `projects.html` had literal U+FFFD replacement-character
   corruption in visible text (e.g. "DomStudio � AI product photo studio")
   — the same encoding damage the 2026-07-31 entry says was fixed
   elsewhere, but this instance was missed. One of the five spots
   (`domstudio_after_label`) has no i18n translation at all, so it was
   permanently visible, not just a pre-JS flash. Restored proper em/mid
   dashes matching the actual `i18n.js` translations. Separately, the fixed
   cookie banner (up to 700px wide, centered) renders tall enough on
   narrow-to-tablet viewports to sit directly on top of the lead-chat
   launcher until dismissed. Its height varies with viewport width, text
   wrapping, and web-font load timing, so a fixed pixel offset per
   breakpoint kept being wrong at some width or another; switched to a
   `ResizeObserver` on the banner that keeps the launcher's clearance in
   sync with its actual rendered height. Verified across 14 viewport
   widths (320–1440px) with no overlap at any of them.

8. **`2c00494`** — Fix deploy zip silently dropping 11 hidden-attribute
   asset files
   Every previous deploy zip (including the one rebuilt earlier this
   session) was missing 11 files under `assets/` — `dom_video.mp4`,
   `logo.video.mp4`, `logo_video.mp4`, `logo.png`, and 7 more, all
   referenced by the live site — even though `dist/` had all 26 correctly.
   Root cause: those 11 files carry the Windows Hidden attribute, and
   `Compress-Archive` honors `-Force` for items passed to it directly but
   not for hidden files it discovers on its own while recursing into a
   piped-in folder — so the existing `Get-ChildItem -Force |
   Compress-Archive` fix (from the 2026-07-31 robots.txt/site.webmanifest
   incident) only covered `dist/`'s top level, not files nested inside
   `assets/`. `build()` now strips the Hidden attribute recursively across
   all of `dist/` right after copying. Also replaced the
   `REQUIRED_FILES`-only zip check with a full recursive diff against
   `dist/`'s actual contents — `REQUIRED_FILES` never listed a single asset
   path, which is exactly why this went undetected through however many
   prior deploys. If those 11 files aren't already live on techdolphin.ru,
   this is why.

   Also rebuilt `dist/`/the deploy zip twice over the course of this
   session (once mid-session, once after the fix above) since it had
   already gone stale relative to source by the time each rebuild
   happened — same class of problem as 2026-07-31 item 6.

## 2026-07-31 — Site audit and fixes

A full review of the project turned up 8 issues, fixed one by one below, plus two
regressions caught along the way while verifying the fixes. All commits are on
`main` and pushed to `origin/main`; `netlify-abroad/` was deployed to production
at https://nate-web3.com.

1. **`331cd43`** — Add missing pages to sitemap.xml
   `pricing.html`, `contact.html`, and `faq.html` were never added when the
   single-page site was split into five, so search engines only knew about `/`
   and `/projects.html`.

2. **`a5d6ed7`** — Fix cross-site SEO: hreflang tags and wrong canonical URLs
   The netlify-abroad (English) pages had `canonical`/`og:url` pointing at
   `techdolphin.ru` instead of their own domain (`nate-web3.netlify.app`),
   which could make search engines treat the English site as duplicate content.
   Added `hreflang` alternate links between the `ru` and `en` variants.

3. **`13a5120`** — Track Yandex verification file, gitignore build artifacts
   `yandex_3d97a29ea20ba61d.html` must be deployed at the site root for Yandex
   Webmaster verification, so it now belongs in version control. `dist/` and
   `*.zip` are generated deploy bundles that don't need to be in git history.

4. **`73ee929`** — Add honeypot spam protection to lead forms
   The callback form, contact form, and lead chatbot all send through a
   client-side EmailJS public key with no bot protection. Added a
   visually-hidden `hp_website` field to each form; if it's filled in (only a
   bot would do this) the form fakes a normal success response instead of
   calling EmailJS. Also fixed `email-form-smoke.spec.js`, which pointed at
   `index.html`'s `#ct-form` — that form moved to `contact.html` when the site
   was split into pages, so the test had been silently timing out.

5. **`73fc384`** — Fold theme-preview.css into style.css, drop the duplicate stylesheet
   `theme-preview.css` was labeled "Temporary" but was loaded unconditionally
   on every page with heavy `!important` overrides, meaning any future style
   change had to be made in two files to actually take effect. Moved its rules
   to the end of `style.css` (verified identical rendering with before/after
   screenshots across all 5 pages) and dropped the second stylesheet and its
   extra HTTP request.

6. **`31e0ea4`** — Add `npm run package` to build and verify the deploy bundle
   The last spaceweb-upload zip was missing `js/main.js` and `js/analytics.js`
   even though every page requires them. `scripts/package-deploy.js` rebuilds
   `dist/` from the whole repo minus a small exclude list, verifies every
   required file landed in `dist/`, zips it, and re-verifies the zip itself.
   That last check caught a real bug: `robots.txt` and `site.webmanifest` had
   the Hidden attribute set on disk, which `Compress-Archive -Path dist\*`
   silently skips. Switched to `Get-ChildItem -Force | Compress-Archive` and
   cleared the Hidden attribute on both files.

7. **`0e3c38b`** — Add mobile nav, filter tab, and i18n Playwright tests; fix z-index bug they caught
   The only existing test covered the contact form. Added `ui-smoke.spec.js`
   for the mobile nav, projects filter tabs, and language toggle. Writing the
   mobile-nav test surfaced a real bug: `#cookie-banner` (z-index 9998) sat
   above the open mobile menu overlay (z-index 9990), silently eating clicks
   on the close button and nav links until the banner was dismissed. Bumped
   `.nav-links` to z-index 9999.

8. **`793874a`** — Fix pricing calculator text becoming unreadable in light theme
   A regression from step 5: calc-card text is styled via inline
   `style="color:#E8F5EC"` / `"color:#7AAF87"` attributes set by
   `renderCalc()` in `main.js`, calibrated for the old dark theme. The
   light-theme override rules targeting those exact inline colors need
   `!important` to ever win against an inline style attribute — without it
   they silently did nothing, so card titles/descriptions rendered
   near-invisible (light-on-white). Re-added `!important` to those three rules.

9. **`e67640c`** — Port netlify-abroad to the current 5-page site structure
   netlify-abroad (operated as Datvida LLC for non-Russian clients) predated
   the 5-page split and hadn't picked up the light theme, mobile-nav fixes, or
   honeypot protection. Split its single `index.html` into dedicated
   `pricing.html`, `faq.html`, and `contact.html` — the English copy, USD
   pricing, and Datvida contact/legal details for these sections already
   existed unused in `js/i18n.js` and `js/main.js` (`CALC_SERVICES`) from
   earlier prep work, so they were reused rather than retranslated. Ported the
   light theme, the same mobile-menu z-index fix, missing scroll-lock/close-
   button behavior, and the honeypot gap. Fixed literal U+FFFD
   replacement-character corruption in two files (encoding damage from an
   earlier save), restored as em dashes from context. Fixed netlify-abroad's
   canonical/og:url pointing at `techdolphin.ru` instead of its own domain,
   and added hreflang alternates in both directions — including on
   `techdolphin.ru`'s pricing/faq/contact pages, which had none since
   netlify-abroad had no equivalents until now. Updated `sitemap.xml` with the
   3 new pages.

   Verified with Playwright: mobile nav open/close, honeypot blocking bot
   submissions while legit submissions still send, and project filter tabs
   all work correctly on the ported pages. Verified live after deploy: nav
   structure, FAQ content, and the Datvida LLC privacy policy text all render
   correctly at https://nate-web3.com.
