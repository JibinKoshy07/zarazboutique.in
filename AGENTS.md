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
- ⚠ Two footguns that broke the build once — keep them fixed:
  1. `frontend/.dockerignore` must NOT ignore `nginx.conf.template` (the web
     Dockerfile copies it to `/etc/nginx/templates/`). It is intentionally absent
     from that file.
  2. Files created by tooling can land as mode `600`, which nginx's unprivileged
     `nginx` worker cannot read → the site returns **403**. The frontend
     Dockerfile runs `chmod -R a+rX /usr/share/nginx/html` as a safety net; also
     keep repo files `a+r` (`find . -type f -exec chmod a+r {} +`).

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
