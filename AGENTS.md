# Zaraz Boutique — Repo Knowledge (v2)

## Stack
- Backend: Express + `pg` (PostgreSQL), ES modules. Entry `backend/src/index.js`
  (boot: wait for DB → migrate → seed → listen). `backend/src/app.js` builds the
  app; `backend/src/config/env.js` parses env.
- Frontend: plain HTML/CSS/JS, served by **nginx** which also proxies `/api` and
  `/uploads` to the API. No build step.
- DB: PostgreSQL. Schema `backend/src/db/migrations/001_init.sql`, seeds
  `backend/src/db/seed.js` (idempotent).

## Hard constraint: API URL
Frontend always calls **same-origin `/api`**. nginx proxies it to the API
service. NEVER hardcode a host (especially not a `work-*.prod-runtime.all-hands.dev`
sandbox URL) — a hardcoded URL breaks local dev whenever sandbox code is pulled.

## Docker (primary way to run)
- `docker compose up -d --build` → web :8080, api :4000, db :5432.
- Services: `db` (postgres:16-alpine, container `zaraz-pg`), `api` (`zaraz-api`),
  `web` (`zaraz-web`). Volumes `zaraz-db-data`, `zaraz-uploads`.
- Compose requires `JWT_SECRET` (`.env.example` → `.env`).
- Docker needs sudo in this sandbox: `sudo docker ps`, `sudo docker compose …`.
- ⚠ Four footguns that broke the build/runtime once — keep them fixed:
  1. `frontend/.dockerignore` must NOT ignore `nginx.conf.template` (the web
     Dockerfile copies it to `/etc/nginx/templates/`). It is intentionally absent
     from that file.
  2. Files created by tooling can land as mode `600`, which nginx's unprivileged
     `nginx` worker cannot read → the site returns **403**. The frontend
     Dockerfile runs `chmod -R a+rX /usr/share/nginx/html` as a safety net; also
     keep repo files `a+r` (`find . -type f -exec chmod a+r {} +`).
  3. `location /uploads/` in `nginx.conf.template` MUST stay `location ^~ /uploads/`.
     The static-asset regex location (`\.(css|js|...|avif|...)$`) also matches
     image extensions and, because regex locations outrank plain prefix ones,
     it would win — nginx then looks for the file on the *web* container's disk
     (uploads live on the *api* volume) and answers its own 404 (`text/html`,
     ~146 B). Symptom: upload succeeds but the returned image URL 404s.
  4. Express 4's bundled `send`/`mime@1.6` predates AVIF, so `.avif` uploads
     would be served as `application/octet-stream` and blocked by `nosniff`.
     `app.js` sets `Content-Type: image/avif` for `.avif` in `express.static`'s
     `setHeaders`. Keep that mapping when touching static serving.
- ⚠ **Never put a static asset behind a URL containing `/api`.** Production
  (Cloudflare in front of this app) proxies *any* path containing the substring
  `/api` to the backend, which answers with a JSON 404 — so a script named
  `assets/js/api.js` was served as `application/json` and blocked by
  `X-Content-Type-Options: nosniff`. The storefront client therefore lives at
  `frontend/assets/js/client.js` (global `window.API`). Keep new assets out of
  `/api*` paths.
- ⚠ **Don't set `grid-template-columns` in an inline `style`.** An inline rule
  beats the media queries in `styles.css`/`admin.css`, so the layout can't
  collapse and phones scroll sideways. Use the responsive classes instead
  (`.split-sidebar`, `.split-even`, `.product-grid-fit`) and keep `min-width: 0`
  on grid children so `.table-wrap` can scroll its table rather than stretch the
  card.
- ⚠ **Never put `backdrop-filter` (or `filter`/`transform`/`perspective`/`contain:
  paint`) on `.site-header`.** Any of those makes the header the *containing
  block* for `position: fixed` descendants, so the mobile nav drawer
  (`.nav`, `position: fixed; top:0; bottom:0`) is trapped inside the header bar
  and clips its own links. The frosted look lives on `.site-header::before`
  instead — keep it there. Symptom: the mobile menu opens but only shows a sliver
  of links and cannot scroll.
- ⚠ **The mobile nav backdrop must stay INSIDE `.site-header`.** The header has
  `z-index: 60`, which makes it a stacking context, so `.nav`'s `z-index: 100`
  only counts *within* the header. A backdrop placed as a sibling of the header
  (root context) paints over the whole header — menu included — and its
  `blur(3px)` smears the links. Inside the header the order is backdrop(1) <
  `.header-inner`(2) < `.nav`(100), which keeps everything crisp.

## Layout
- `backend/src/modules/*` — service layer (auth, users, products, categories,
  cart, addresses, orders, admin).
- `backend/src/routes/*` — thin HTTP layer.
- `backend/src/services/payment/index.js` — provider interface
  (`createIntent`/`capture`); only `manual` (offline) exists. To add a real
  gateway, implement the interface, register it, set `PAYMENT_PROVIDER`.
- `backend/src/services/storageService.js` — image storage (local disk).
- `frontend/*.html` + `frontend/assets/` — storefront.
- `frontend/admin/` — admin console (own CSS/JS under `assets/`).
- `frontend/assets/img/hero-saree-mannequin.svg` — bespoke storefront hero
  (mannequin in a teal + antique-gold saree). Self-hosted SVG, no external
  hotlink. **Never commit stock previews** (e.g. iStock/Shutterstock comps) —
  they ship a visible watermark and are unlicensed. Only use free-licence
  sources (Pexels/Unsplash/Commons) or original artwork.

## Auth & security
- bcrypt password hashing; stateless JWT (`JWT_SECRET`, `JWT_EXPIRES_IN`).
- Middleware `requireUser` / `requireAdmin` (`backend/src/middleware/auth.js`).
  ALL `/api/admin/*` except `/admin/login` require an admin token.
- Server-side validation on every write (`backend/src/utils/validate.js`);
  parameterised SQL only.
- Order totals are ALWAYS recomputed from DB prices server-side — never trust a
  client-supplied amount.
- Rate limiting (`rateLimit.js`), CORS allow-list (`ALLOWED_ORIGINS`), security
  headers, 1 MB JSON body limit. Uploaded-image URLs built from `API_PUBLIC_URL`.

## Seeded accounts
- Admin is created on first boot from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. **No
  credentials are committed anywhere** — when `ADMIN_PASSWORD` is blank the
  seeder generates a random password and prints it once to the API logs
  (`[seed] generated admin password …`). Set `ADMIN_PASSWORD` in `.env` for a
  predictable login.
- The demo shopper (`priya@example.com`) is only created when
  `DEMO_CUSTOMER_PASSWORD` is set; leave it blank to skip it.
- Add extra admins by inserting into the `admins` table with a bcrypt hash
  (`hashPassword` in `backend/src/middleware/auth.js`), or by changing
  `ADMIN_EMAIL` and re-running the seed.
- ⚠ dotenv truncates values at `#` unless quoted — `jibu#007` must be `'jibu#007'`.

## Admin console
- Order status workflow: Pending → Confirmed → Processing → Shipped →
  Out for Delivery → Delivered, plus Cancelled / Returned / Refunded. Status
  changes append to order history.
- Dashboard stats: revenue, orders, products, customers, pending, low stock,
  recent orders, top products (top products include stock + threshold).
- Categories support exactly ONE level of subcategories.
- Each category carries a single `image` (nullable `VARCHAR(1024)`) shown on the
  storefront category tile. Admins set it from the category modal (upload, or
  paste a URL); `frontend/assets/js/pages/home.js` falls back to its built-in
  `CATEGORY_IMAGES` map when a category has no image.
- ⚠ Optional text fields must be `.nullish()` in zod, NOT
  `.optional().or(z.literal(''))`. The admin forms send `null` for a blank field
  (`values.x ? values.x.trim() : null`), and `.optional()` rejects `null`, which
  made "Add category"/"Add product" fail with a 400 whenever a text field was
  left empty. The service layer already coalesces `payload.x || null`.

## Testing locally (this sandbox)
- Run the API on the sandbox port (e.g. `PORT=12001 node src/index.js`) with a
  local Postgres; the sandbox proxy forwards `/api` to it.
- Backend suite: `python3 /tmp/apitest/test.py` → expects 175 passed / 0 failed.
  Point it at whichever host/port the API is on.
- Verify the real deployment with Docker Compose, not just the dev harness: the
  dev harness serves static files as a privileged user and will NOT reproduce the
  nginx 403 permission bug.

## Workflow Rules (standing)
1. Always push to git after changes (`git push`); branch is `release/v2`.
2. Keep brand tokens consistent: Playfair Serif headings, Turkish teal / antique
   gold / cream / blush palette, soft cream background. Storefront tokens are
   semantic (`--brand`, `--brand-deep`, `--brand-soft`, `--accent`,
   `--accent-light`, `--accent-deep`, `--blush`) so the palette can be swapped
   without touching rules; the admin console mirrors them as `--a-maroon`
   (teal), `--a-gold`, `--a-sidebar`. Admin prioritises usability.
3. When changing the order schema, update the status list AND all admin/frontend
   renderers.
4. Quote dotenv values containing `#`.
