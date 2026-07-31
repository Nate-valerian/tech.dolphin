# Changelog

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
