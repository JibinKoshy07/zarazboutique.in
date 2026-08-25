# Zaraz Boutique — Repo Knowledge

## Stack
- Express + pg (PostgreSQL), plain HTML/CSS/JS storefront & admin
- Frontend: `index.html`, `product.html`, `checkout.html`, `orders.html`, `about.html`, `contact.html` (both static, no API) — API URL is auto-detected once for all pages: `locations.hostname ∈ {localhost,127.0.0.1} → http://localhost:3000/api`, else `location.origin + /api`. NEVER hardcode a sandbox/work host URL (e.g. `work-*.prod-runtime.all-hands.dev`) — a hardcoded URL earlier broke the user's local dev whenever they pulled sandbox-tuned code
- Admin panel: `admin.html` — same auto-detect as above
- Backend: `backend/server.js`, `backend/db.js`

## Notable Behaviors
- **Subcategories**: `categories.parent_id` self-FK, exactly ONE level (backend rejects deeper). A parent's filter includes products of its subcategories (server: `OR category_id IN (SELECT id FROM categories WHERE parent_id = $1)`; client: same expansion in `renderProducts`). Chips render parent first + `› sub` chips when parent/sub is active. Admin renders subs as `Parent › Sub`. Deleting a parent → subs become top-level (ON DELETE SET NULL)
- **Cart persistence**: localStorage key `zaraz_cart`; index, product, checkout read it; `sessionStorage` key `zaraz_checkout_items` used for BUY NOW flow
- **Order statuses (ORDER_STATUSES in server.js)**: `['Placed','Processing','Shipped','Out for Delivery','Delivered','Cancelled','Payment Failed','Returned','Refunded']`
- **Status history**: stored in dedicated table `order_status_history` (separate from `orders`). PUT `/api/admin/orders/:id/status` appends a row. GET `/api/orders/:userId/:orderId` returns `history` (not `status_history`)
- **Contact form**: `contact.html` POSTs to `/api/contact` → `sendContactMessage` in emailService.js. Recipient is env **`CONTACT_FORM_EMAIL`** (skipped gracefully if unset; SMTP_USER/SMTP_PASS must be set to actually send). Reply-To is the visitor's email
- **Payments (Cashfree PG)**: env `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` / `CASHFREE_ENV` (sandbox|production), optional `CASHFREE_WEBHOOK_SECRET` + `APP_BASE_URL`. Flow: checkout.html POSTs `/api/payments/cashfree/create-order` (server RECOMPUTES total from DB prices — never trust client amounts) → internal order created (payment_method `Cashfree`, payment_status `Pending`, cf order id = `zaraz_{orderId}` stored in `orders.cf_order_id`) → Cashfree JS SDK v3 modal (`redirectTarget:'_modal'`) → client polls `GET /api/payments/cashfree/verify/:orderId` (PAID → payment_status `Paid`; EXPIRED/TERMINATED → status `Payment Failed`). Reliable confirmation: `POST /api/webhooks/cashfree` (HMAC-SHA256 over `x-webhook-timestamp` + rawBody, base64 — needs `req.rawBody` captured by express.json verify hook). Old offline flow: paymentMethod `offline` → plain `POST /api/orders`. **Retry/complete payment**: `POST /api/payments/cashfree/repay/:orderId` (body `{userId}`, ownership-checked) creates a FRESH cf order id `zaraz_{id}_{ts36}` (cf ids can't be reused after an attempt) and resets Payment Failed→Placed; orders.html shows a "Complete Payment" button when `payment_method=Cashfree` AND `payment_status ∈ {Pending, Failed}` AND status not in Cancelled/Returned/Refunded; `markOrderPaid` revives Payment Failed→Placed + history row; webhook parses ids with `/^zaraz_(\d+)/`
- **Admin orders search/filter**: `/api/admin/orders?q=` and `?status=` query params; frontend filters client-side too via `.orders-toolbar`

## Auth & Security (post-hardening)
- **Session tokens**: stateless HMAC-signed (`base64url(payload).sig`), secret = env `SESSION_SECRET` (fallback ADMIN_PASSWORD/CASHFREE_SECRET_KEY; set SESSION_SECRET in prod), 7-day expiry. Login & register return `{token, user}`; admin login returns `{token, admin}`.
- Frontend stores token in `localStorage` (`zaraz_token` user / `zaraz_admin_token` admin) and sends `Authorization: Bearer <token>` via `authHeaders()` (index/checkout/orders) and `adminHeaders()` (admin.html). Logout clears both user+token keys.
- **Middleware**: `requireUser` / `requireAdmin` in server.js. Protected: `GET/PUT /api/users/:id*`, `GET /api/orders*`, `POST /api/orders`, all `/api/payments/cashfree/*` (user id from `req.auth.id`, NOT body), and ALL `/api/admin/*` except `/admin/login`.
- **User id / order total are NEVER trusted from the client** — both derived server-side (token → userId; `computeOrderTotal(items)` → total).
- **CORS** restricted to `ALLOWED_ORIGINS` env (comma-separated); **security headers** middleware added; **JSON body limit** 1mb. Upload image URL built from `API_PUBLIC_URL` (never the Host header).
- New env vars (see .env.example): `SESSION_SECRET`, `ALLOWED_ORIGINS`, `API_PUBLIC_URL`.

## Admin
- Seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env on first boot
- Login via POST `/api/admin/login` returns `isAdmin:true`
- ⚠ dotenv truncates env values at `#` unless quoted — password like `jibu#007` must be `'jibu#007'` in .env

## Common Docker / DB commands
- Container name: **`zaraz-pg`** (not `zaraz-postgres` or `zaraz_postgres`)
- DB name: **`zaraz`** (not `zaraz_db`); user: `postgres` (suggested by init) or `zaraz_user` if set
- Docker requires sudo in this sandbox: `sudo docker ps`

## Workflow Rules (standing)
1. **Always push to git after changes** (`git push`)
2. Keep brand design tokens consistent: Playfair Serif headings, `--color-brand` pink/red, soft beige background
3. When changing order schema, update `ORDER_STATUSES` constant AND admin/frontend renderers
4. quote dotenv values containing `#`

## Testing Locally (this sandbox)
- Backend runs on the external sandbox port (`12001`); sandbox proxy forwards `/api` there, so source code must ALWAYS use the auto-detect snippet at the top of each page (see Stack section) — direct hostnames are a footgun
- `product.html?id=N` page needs an extra ID check — renders blank if product fetch fails or JS has template literal issues
- When testing browser-side: register a user, add to cart (localStorage), then buy-now — sessionStorage carries items to checkout.html
