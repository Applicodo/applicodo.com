# Applicodo

Plain HTML, CSS and minimal JavaScript for independent iOS development. Only `public/` is published; Pages Functions under `functions/api/` are compiled separately. No framework or website database.

## Development

Use Node 22+. Run `npm ci`, `npm run dev` and `npm run check`. Local and preview deployments cannot send email. `npm audit` checks development tooling; there are no production npm dependencies.

## Production contact setup

Keep Cloudflare Pages project `applicodo`, production branch `master`. Wrangler sets production-only `CONTACT_ENVIRONMENT=production` and `CONTACT_DELIVERY_ENABLED=true`; local and previews are disabled.

Set production-only bindings `TURNSTILE_SITE_KEY` (public widget key), `TURNSTILE_SECRET_KEY`, and `RESEND_API_KEY` in Pages settings. Use a Turnstile widget restricted to `applicodo.com` and action `contact`. Never put secrets in source, public files, logs, shell arguments, screenshots or preview bindings. Only the public widget key is exposed through `/api/contact-config`.

Verify Resend sender domain `forms.applicodo.com` using its exact DKIM/SPF/bounce records; preserve Workspace apex MX/SPF/DKIM/DMARC and unrelated DNS. Use a dedicated sending-only key restricted to that domain, with open/click tracking off. Fixed sender: `Applicodo website <website@forms.applicodo.com>`; fixed recipient: `contact@applicodo.com`. The visitor email is Reply-To only. No auto-replies or marketing contacts.

Configure the WAF rule in `docs/contact-rate-limit.json` before enabling delivery: five POSTs per IP per ten seconds to the exact production contact endpoint, with a ten-second block. Preserve other rules. Host checks independently prevent Pages-alias delivery.

One labelled controlled enquiry must reach the fixed inbox before delivery is reported verified. Provider acceptance alone is insufficient.

## Releases

`npm run deploy:preview` and `npm run deploy:production` validate then deploy `public/` to the existing Pages project through Wrangler. Authenticate with minimum Pages scopes; no new project/account or paid upgrades. Deploying the repo root is forbidden. Keep provider secrets and design/security documentation outside the publish root.

Require independent design/security review and passing checks. Record reviewed commit, preview URL, live hostname/TLS, security headers, assets, real 404 responses, disabled preview delivery and inbox receipt. Preserve www-to-apex canonicalization and ensure HTTP redirects to HTTPS. HSTS intentionally omits includeSubDomains to protect unrelated services. Existing Pages deployments supply rollback; do not remove the last working deployment during cleanup.

## Security and data

Bounded JSON accepts name/email/message/Turnstile token. Verification checks success, hostname and action before a fixed REST call to Resend. Exact origin/production guards, uncached API responses, inert plain text and restrictive security headers reduce the attack surface. The application does not log submitted content, email addresses or tokens. Run credential-related Wrangler commands with `WRANGLER_WRITE_LOGS=false` so operator tooling does not save credential responses to debug logs.

No website lead database, accounts, uploads, payments or analytics. Enquiries necessarily remain in the destination mailbox; Cloudflare and Resend process them under their retention policies. See `applicodo.com-threat-model.md`.

## Design and cleanup

The user chose Impeccable's concept-first workflow and approved A — Open canvas. Authentic CaptionFast screen/icon copies carry provenance metadata. Manrope is self-hosted with its SIL Open Font License.

Owned dependencies, mocks and captures have a combined 512 MiB budget. Stop owned processes before cleanup. Remove superseded images, duplicate captures, archives, local dependencies/build caches and disposable credentials when no longer needed. Preserve source, final assets, approved comp, minimum evidence, user/unrelated data and provider rollback deployments.
