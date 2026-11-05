# Working on Tech Dolphin

Both public sites are generated static files. Change the shared source and run the build; avoid editing generated HTML, CSS, or JavaScript directly.

- `src/templates/layout.html`: page shell.
- `src/templates/components/`: navigation, footer, cookie preferences, and brief.
- `src/templates/pages/`: the five page bodies shared by both regions.
- `src/content/home-projects-*.html`: intentional regional portfolio selections.
- `src/js/` and `src/styles/site.css`: common behavior and design.
- `src/i18n/common.json`: common Russian and English wording.
- `config/regions.json`: domains, business identity, contacts, prices, currency, defaults, and region-specific translations.
- `assets/`: canonical public media, copied to the international output by the build.

Run `npm run build` to generate both sites and content-based cache versions. Run `npm run check` to reject output drift, missing translations, inconsistent operator/currency/contact settings, missing assets, or structural errors. Run `npm test` for browser and packaging regressions; email and analytics services are mocked.

Sitemap dates follow changed page content, tracked in `config/content-dates.json`. Rebuilding unchanged content preserves its date. The footer year uses Europe/Moscow time.

Use `npm run package:all` for verified Russian and international deployment ZIPs. Packages include public files only and are checked by exact file name, length, and SHA-256 hash. Packaging does not publish either site.

Netlify uses the root `netlify.toml`: base `.`, command `npm run build:international`, publish directory `dist-international`. The command rebuilds both regional outputs, checks them, then stages only the international public files. Staging runs in Node on Windows or Linux; it does not need the Windows ZIP tools. Never publish the repository root.

For a manual Netlify upload, run `npm run package:international` on Windows and upload the resulting ZIP, or upload the contents of `dist-international` after `npm run build:international`. Both use the same public-file allowlist. These commands prepare files without deploying.

International URL aliases are generated into `netlify-abroad/_redirects` and included in the publish folder and upload ZIP. `/pricing` and `/pricing/`, for example, redirect to the canonical `/pricing.html`, preserving query parameters. `netlify.toml` disables Pretty URLs to keep that format consistent; use the same setting for a manually configured Netlify site. Language-dependent metadata also recognizes clean URLs when a host serves them directly.

The compatibility command `npm run check-drift -- --update` regenerates outputs from the canonical source. It no longer accepts arbitrary differences between hand-edited copies.
