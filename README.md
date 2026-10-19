# NodeMart — Node.js E-commerce

Next.js 16 store with an admin panel, built on Node.js, TypeScript, Tailwind CSS and SQLite (Drizzle ORM).

## Run it

Double-click `start-shop.bat`, or:

```bash
npm run dev
```

- Store: http://localhost:3000
- Admin: http://localhost:3000/admin

Demo logins (created by `scripts/seed.ts`):

| Role     | Email               | Password |
|----------|---------------------|----------|
| Admin    | admin@shop.test     | password |
| Customer | customer@shop.test  | password |

Demo coupons: `WELCOME10` (10%), `FLAT500` (Rs. 500 off over Rs. 3,000), `MEGA25` (25% off over Rs. 10,000).

## First-time setup on another machine

```bash
npm install
copy .env.example .env.local   # then set SESSION_SECRET to a long random string
npm run setup                   # creates data/shop.db and fills demo data
npm run dev
```

## Features

**Storefront** — home page (hero, categories, featured, new arrivals, brands), shop with search, category, brand, price, stock and sale filters plus sorting and pagination, product page with gallery, reviews and related products, add to cart without reload, wishlist, cookie cart with coupons and a free-shipping progress bar, guest or account checkout (Cash on Delivery / Bank Transfer), order confirmation, customer account with order history, order tracking and profile.

**Admin (`/admin`)** — dashboard (monthly revenue, orders, customers, low stock, 30-day sales chart, latest orders, best sellers), products (image upload, gallery, pricing, stock, featured/active switches, filters), categories, brands, orders (status updates, mark paid, edit, filters by status/payment/date), coupons, review moderation, customers. Cancelling an order puts its stock back.

## How it is built

| Part | Where |
|------|-------|
| Database schema (tables) | `src/db/schema.ts` |
| Demo data | `scripts/seed.ts` |
| Cached catalog queries | `src/lib/catalog.ts` |
| Cart, sessions, orders | `src/lib/cart.ts`, `src/lib/session.ts`, `src/lib/orders.ts` |
| Server Actions (form/button handlers) | `src/actions/` |
| Store pages | `src/app/(shop)/` |
| Admin pages | `src/app/admin/` |
| Route protection | `src/proxy.ts` |

Store pages use Next.js Cache Components: catalog data is cached with `"use cache"` and refreshed with `updateTag("catalog")` whenever an admin edits something or an order changes stock. Per-user parts (cart count, account, wishlist) stream in behind `<Suspense>`.

## Useful commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Development server with hot reload |
| `npm run build` then `npm start` | Production build and server |
| `npm run db:push` | Create/update tables from `src/db/schema.ts` |
| `npm run db:seed` | Reset all data to the demo data |
| `npm run typecheck` / `npm run lint` | Check the code |

Shop settings (name, currency, shipping fee, free-shipping threshold, phone, email) are in `.env.local`. Uploaded images are stored in `uploads/`.
