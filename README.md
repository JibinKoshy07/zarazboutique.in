# Zaraz Boutique

A premium Indian saree e-commerce application: an elegant customer storefront
plus a separate admin console, backed by a real PostgreSQL database.

- **Storefront** - home, shop, product, cart, checkout, order confirmation,
  account (orders / addresses / profile), login, register, about, contact.
- **Admin console** - dashboard, products, categories, inventory, orders,
  customers and contact messages.
- **Backend** - Express + `pg` REST API with JWT auth, role-based access control
  and server-side validation.
- **Database** - PostgreSQL with versioned migrations and idempotent seed data.

Everything runs with a single command:

```bash
docker compose up -d --build
```

Then open **http://localhost:8080** for the storefront and
**http://localhost:8080/admin/** for the admin console.

---

## 1. Quick start

```bash
# 1. Create your environment file
cp .env.example .env

# 2. Set a strong JWT secret (required)
#    macOS:  sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 48)|" .env
#    Linux:  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 48)|" .env

# 3. Build and start everything
docker compose up -d --build
```

The API waits for the database, applies migrations, seeds sample data and only
then starts serving. First boot takes a few seconds.

| Service    | URL                            | Notes                       |
| ---------- | ------------------------------ | --------------------------- |
| Storefront | http://localhost:8080          | Customer-facing site        |
| Admin      | http://localhost:8080/admin/   | Separate admin console      |
| API        | http://localhost:4000/api      | Direct API access (debug)   |
| PostgreSQL | localhost:5432                 | Inspect the DB locally      |

### Seeded accounts

| Role     | Email                       | Password        |
| -------- | --------------------------- | --------------- |
| Admin    | `admin@zarazboutique.in`    | `Admin@12345`   |
| Customer | `priya@example.com`         | `Customer@123`  |

Change these in `.env` before any real deployment.

Useful commands:

```bash
docker compose logs -f api      # follow API logs
docker compose ps               # service + health status
docker compose down             # stop (keeps volumes)
docker compose down -v          # stop and delete the database volume
```

---

## 2. Architecture

```
Browser ──► web (nginx :80) ──┬─► static storefront + admin console
                              └─► /api/*  ──► api (Express :4000) ──► db (Postgres)
                                              /uploads/*  (product images)
```

- The frontend is plain HTML/CSS/JS. It always calls the **same-origin** `/api`
  path; nginx proxies that to the API service. No host is ever hard-coded, so
  the same build works locally, in Docker and behind any reverse proxy.
- The API owns all business logic and talks to PostgreSQL through a connection
  pool. Uploaded images are served from a volume mounted into the API container.
- The database is a named volume (`zaraz-db-data`), so data survives rebuilds.

### Repository layout

```
.
├── docker-compose.yml          # db + api + web services
├── .env.example                # every supported environment variable
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── index.js            # boot: wait for DB → migrate → seed → listen
│       ├── app.js              # express app, middleware, route mounts
│       ├── config/             # env parsing
│       ├── db/                 # pool, migrations, seed
│       ├── middleware/         # auth, rate limiting, errors
│       ├── modules/            # auth, users, products, categories, cart,
│       │                       # addresses, orders, admin
│       ├── routes/             # thin HTTP layer over the modules
│       ├── services/           # storage + payment providers
│       └── utils/              # validation, serialization, helpers
└── frontend/
    ├── Dockerfile
    ├── nginx.conf.template
    ├── *.html                  # storefront pages
    ├── assets/                 # shared CSS + JS (api client, store, ui)
    └── admin/                  # admin console (own CSS + JS)
```

---

## 3. Features

### Storefront

- Home page with hero, categories, featured products, new arrivals and
  bestsellers.
- Shop page with category filters, subcategories, search, sorting and
  pagination.
- Product detail with image gallery, sizes, colours, stock state, related
  products.
- Cart and checkout with address selection, payment-method choice and order
  notes.
- Order confirmation with a status timeline, plus order tracking in the account
  area.
- Customer registration, login, logout and a profile area with order history
  and full address management (add / edit / delete / set default).
- Contact form.

### Admin console

- Separate login, dashboard with revenue, orders, products, customers, pending
  orders, low stock and recent orders.
- Full product management (images, description, price, sizes, colours, stock,
  category, visibility flags).
- Category management with one level of subcategories.
- Order management with customer info, delivery address, payment status and a
  status workflow (Pending → Confirmed → Processing → Shipped → Out for
  Delivery → Delivered, plus Cancelled / Returned / Refunded).
- Order search and filters, plus a detailed order view with status history.
- Inventory view with low-stock / out-of-stock filters and quick stock adjust.
- Customer list with activation toggle and per-customer order history.
- Contact-message inbox.

---

## 4. Payments

Payment functionality is intentionally **modular and gateway-ready** but no live
gateway is integrated yet.

- The available methods are served by `GET /api/payment-methods` and rendered by
  the checkout UI.
- `backend/src/services/payment/index.js` exposes a provider interface
  (`createIntent` / `capture`) with a `manual` (offline) implementation: Cash on
  Delivery, UPI and Card are recorded as *pending* and confirmed by the store.
- To add a real gateway, implement the same interface in a new provider, register
  it in that file and set `PAYMENT_PROVIDER` in `.env`. No frontend changes are
  required.

Order totals are always recomputed **server-side** from database prices; amounts
sent by the client are never trusted.

---

## 5. Security

- Passwords hashed with bcrypt.
- Stateless JWT sessions with configurable expiry (`JWT_EXPIRES_IN`).
- Role-based access control: `requireUser` and `requireAdmin` middleware guard
  every protected route; all `/api/admin/*` routes except login require an admin
  token.
- Server-side validation on every write (`backend/src/utils/validate.js`).
- Parameterised SQL everywhere (no string-concatenated queries).
- Rate limiting on the API and stricter limits on auth endpoints.
- CORS restricted to `ALLOWED_ORIGINS`.
- Security headers (`nosniff`, frame options, referrer policy) and a 1 MB JSON
  body limit.
- Uploaded image URLs are built from `API_PUBLIC_URL`, never from a request
  header.

---

## 6. Configuration

All variables are documented inline in [`.env.example`](.env.example). The most
important ones:

| Variable            | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `JWT_SECRET`        | **Required.** Signing key for session tokens.        |
| `DB_*`              | Database name, user, password, pool size.            |
| `WEB_PORT`          | Host port for the site (default `8080`).             |
| `API_PUBLIC_URL`    | Public origin used to build uploaded-image URLs.     |
| `ALLOWED_ORIGINS`   | Comma-separated browser origins allowed to call API. |
| `ADMIN_EMAIL/PASSWORD` | Seeded administrator credentials.                |
| `SEED_ON_START`     | Create sample data on boot (`true`/`false`).         |
| `PAYMENT_*`         | Payment provider and enabled methods.                |

---

## 7. Local development (without Docker)

Requires Node.js 20+ and a reachable PostgreSQL instance.

```bash
cd backend
npm install
# Point the app at your database, e.g.:
export DB_HOST=localhost DB_PORT=5432 DB_NAME=zaraz \
       DB_USER=zaraz_user DB_PASSWORD=zaraz_password \
       JWT_SECRET=dev-secret PORT=4000
npm run dev        # or: node src/index.js
```

The API applies migrations and seeds data on boot. Serve the `frontend/`
directory with any static server and make sure `/api` reaches the API (the
included nginx config shows one way).

---

## 8. Database

- **Migrations** run automatically on API boot from `backend/src/db/migrations/`
  and are recorded so each runs exactly once.
- **Seed data** is idempotent: an admin user, a demo customer, categories,
  products and a sample order.
- To start clean: `docker compose down -v && docker compose up -d --build`.

---

## 9. License

Provided as-is for the Zaraz Boutique project.
