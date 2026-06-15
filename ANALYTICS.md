# Analytics setup

This site is wired for Yandex Metrica through `js/analytics.js`.

Current counter ID: `109873573`.

## Turn tracking on

1. Create a counter in Yandex Metrica for `techdolphin.ru`.
2. Enable these options in the Metrica counter settings:
   - Click map
   - Link tracking
   - Accurate bounce rate
   - Session Replay / Webvisor
   - Form analysis, if available in your Metrica settings
3. Copy the numeric counter ID.
4. Replace `yandexMetricaId` in both `index.html` and `projects.html` if the counter ID changes.

If the ID is `0`, the analytics code stays inactive.

## Recommended JavaScript event goals

Create JavaScript event goals in Yandex Metrica with these exact IDs:

- `callback_form_start`
- `callback_form_attempt`
- `callback_form_success`
- `callback_form_error`
- `contact_form_start`
- `contact_form_attempt`
- `contact_form_success`
- `contact_form_error`
- `email_click`
- `phone_click`
- `max_click`
- `telegram_click`
- `whatsapp_click`
- `contact_cta_click`

These let you answer:

- Did visitors click phone, email, MAX, Telegram, or WhatsApp?
- Did they open/start a form?
- Did they try to submit?
- Did EmailJS successfully send the lead?
- Which form failed, if the email service or network blocked it?

## Files

- `js/analytics.js` loads Yandex Metrica and tracks contact actions.
- `js/main.js` reports form send success/failure.
- `js/i18n.js` and `index.html` include updated privacy wording for analytics.
