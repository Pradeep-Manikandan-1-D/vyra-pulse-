# PROJECT HANDOVER — Vyra Pulse
**Prepared:** 2026-10-18  
**Status:** Active development — NOT yet deployed to production  
**Source tool:** Antigravity IDE → handing over to VS Code

---

## A. Project Overview & Technology Stack

Vyra Pulse is a **full-stack e-commerce + Business Intelligence platform** for a premium bio-enhanced energy drink brand. It ships:

- A **public-facing storefront** (8 flavors, cart, checkout, order history, Pulse Rewards wallet)
- A **customer account portal** (orders, profile, wallet)
- A **role-gated admin dashboard** with 9 BI analytics categories, inventory management, and order management
- A **role-selection landing page** that funnels visitors to Admin or Customer login

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, SSR) |
| Language | TypeScript 5.6 (strict mode) |
| Styling | Tailwind CSS 3.4 + Vanilla CSS |
| UI Components | Custom (Button, Card, Badge, ThemeToggle) |
| Charts | Recharts 2.13 |
| 3D (legacy) | Three.js 0.186 (package present, viewer removed from UI) |
| Auth & DB | Supabase (auth + PostgreSQL + RLS) |
| SSR Auth | @supabase/ssr 0.5 |
| State | React Context (Auth, Theme, Cart) |
| Icons | Lucide React 0.453 |
| Font | Inter (Google Fonts, loaded via next/font) |
| Package manager | **npm** (package-lock.json present) |
| Node.js | 18+ required (Next.js 14 minimum) |

---

## B. Folder Structure

```
d:\1 MY GODS\Vyra Pulse\
├── .env.example              ← copy to .env.local and fill in values
├── .eslintrc.json            ← ESLint (next/core-web-vitals)
├── .gitignore                ← excludes .env, .env.local, node_modules, .next
├── next.config.mjs           ← Next.js config
├── package.json              ← npm scripts, dependencies
├── package-lock.json         ← lockfile — commit this, use for CI
├── tailwind.config.ts        ← Tailwind design tokens, custom colours
├── tsconfig.json             ← TypeScript config
├── postcss.config.mjs
│
├── Dataset/                  ← Canonical CSV datasets (source of truth; 600 customers, 1000 orders)
│   ├── customers.csv
│   ├── demo_customer_credentials.csv
│   ├── inventory.csv
│   ├── offers.csv
│   ├── order_items.csv
│   ├── orders.csv
│   └── products.csv
│
├── supabase/
│   ├── seed.sql              ← Full seed SQL (generated from CSVs)
│   └── migrations/
│       ├── 20261017000001_initial_schema.sql   ← Tables, enums, indexes
│       ├── 20261017000002_rls_policies.sql     ← Row Level Security
│       ├── 20261017000003_checkout_rpc.sql     ← place_order() RPC
│       └── 20261017000004_auth_triggers.sql    ← Auto-create profiles on signup
│
├── scripts/
│   ├── generate_seed_sql.py  ← Regenerates supabase/seed.sql from CSVs
│   ├── seed_database.ts      ← Seeds DB via Supabase client (npm run seed)
│   ├── validate_data.py      ← Validates CSV integrity (npm run validate)
│   └── verify_auth.ts        ← Auth smoke test (npm run test:auth)
│
├── public/
│   └── assets/
│       ├── branding/
│       │   ├── Logo.png                ← Main Vyra Pulse logo
│       │   ├── admin-login-bg.jpg      ← Admin login background image
│       │   └── customer-login-bg.jpg   ← Customer login background image
│       └── products/
│           └── Drinks.png              ← 8-can hero lineup image
│
├── docs/                     ← Additional documentation (inspect contents)
│
└── src/
    ├── app/                  ← Next.js App Router pages
    │   ├── layout.tsx        ← Root layout: ThemeProvider, AuthProvider, CartProvider, Navbar, Footer
    │   ├── globals.css       ← Global CSS, design tokens (--background, --foreground, etc.)
    │   ├── page.tsx          ← Role-selection landing page (/)
    │   ├── admin/
    │   │   ├── login/page.tsx          ← Admin login (/admin/login)
    │   │   └── page.tsx                ← Admin dashboard (/admin) — 9 BI categories
    │   ├── customer/
    │   │   └── login/page.tsx          ← Customer login (/customer/login)
    │   ├── shop/page.tsx               ← Customer storefront (/shop)
    │   ├── cart/page.tsx               ← Cart (/cart)
    │   ├── checkout/page.tsx           ← Checkout (/checkout)
    │   └── account/
    │       ├── orders/page.tsx         ← Order history + receipt modal (/account/orders)
    │       ├── profile/page.tsx        ← Customer profile (/account/profile)
    │       └── wallet/page.tsx         ← Pulse Rewards wallet (/account/wallet)
    │
    ├── components/
    │   ├── auth/
    │   │   └── AuthProvider.tsx        ← Auth context, session, profile loading
    │   ├── theme/
    │   │   └── ThemeProvider.tsx       ← Dark/light theme, localStorage persistence
    │   ├── layout/
    │   │   ├── Navbar.tsx              ← Top navigation, user dropdown, mobile drawer
    │   │   ├── AdminSidebar.tsx        ← Admin dashboard sidebar navigation
    │   │   └── Footer.tsx              ← Site footer
    │   ├── ui/
    │   │   ├── Button.tsx              ← Button variants (primary, secondary, outline, ghost, danger)
    │   │   ├── Card.tsx                ← Card, CardHeader, CardContent
    │   │   ├── Badge.tsx               ← Badge component
    │   │   └── ThemeToggle.tsx         ← Sun/Moon toggle button
    │   ├── cart/
    │   │   └── CartProvider.tsx        ← Cart state (items, totals, add/remove)
    │   ├── admin/bi/
    │   │   ├── BICategoryNav.tsx       ← BI category tab navigation
    │   │   ├── BIChartCard.tsx         ← Reusable chart wrapper with toolbar
    │   │   ├── BIDrilldownModal.tsx    ← Chart drill-down modal
    │   │   ├── BIFilterBar.tsx         ← Global BI filters (date range, region, etc.)
    │   │   ├── BIUnavailableCard.tsx   ← Fallback card for missing data
    │   │   └── categories/
    │   │       ├── CategoryASalesRevenue.tsx
    │   │       ├── CategoryBProfitability.tsx
    │   │       ├── CategoryCCustomerAnalytics.tsx
    │   │       ├── CategoryDProductPerformance.tsx
    │   │       ├── CategoryERegionalAnalytics.tsx
    │   │       ├── CategoryFOperationalAnalytics.tsx
    │   │       ├── CategoryGInventoryAnalytics.tsx
    │   │       ├── CategoryHMarketingLoyalty.tsx
    │   │       └── CategoryICustomerExperience.tsx
    │   └── 3d/                         ← Three.js legacy (package installed, viewer removed from UI)
    │
    └── lib/
        ├── constants.ts                ← VYRA_FLAVORS, BRAND_ASSETS, static data
        ├── types.ts                    ← Shared TypeScript interfaces
        ├── utils.ts                    ← cn() utility (clsx + tailwind-merge)
        ├── auth/                       ← Auth helper utilities
        ├── bi/                         ← BI data-fetch functions (Supabase queries)
        └── supabase/
            ├── client.ts               ← Browser Supabase client + isSupabaseConfigured()
            ├── server.ts               ← Server-side Supabase client (cookies)
            └── middleware.ts           ← Route protection + role enforcement
```

---

## C. Application Routes

| Route | Page | Access |
|---|---|---|
| `/` | Role-selection landing page | Public |
| `/admin/login` | Admin login | Public (redirects admins to `/admin`) |
| `/customer/login` | Customer login | Public (redirects customers to `/shop`) |
| `/shop` | Customer storefront | Public |
| `/cart` | Shopping cart | Public |
| `/checkout` | Checkout flow | Requires customer login |
| `/account/orders` | Order history + receipt modal | Requires customer login |
| `/account/profile` | Customer profile | Requires customer login |
| `/account/wallet` | Pulse Rewards wallet | Requires customer login |
| `/admin` | Admin dashboard (9 BI categories) | Requires admin role |
| `/admin/orders` | Admin order management | Requires admin role |
| `/admin/inventory` | Admin inventory management | Requires admin role |
| `/admin/customers` | Admin customer list | Requires admin role |
| `/admin/products` | Admin product management | Requires admin role |
| `/admin/offers` | Admin offers/coupons | Requires admin role |
| `/admin/analytics` | Admin analytics deep-dive | Requires admin role |

---

## D. Feature Status

### ✅ Implemented and Verified (code inspected)

| Feature | File(s) |
|---|---|
| Role-selection landing page with Admin/Customer cards + images | `src/app/page.tsx` |
| Auth-aware redirect on landing page (admin→/admin, customer→/shop) | `src/app/page.tsx` |
| Admin login page — split panel, form validation, error/success states, forgot password | `src/app/admin/login/page.tsx` |
| Customer login page — full-screen bg, floating card, OR divider, Continue as Guest, Create account | `src/app/customer/login/page.tsx` |
| Dark/light theme toggle — persists to localStorage | `ThemeProvider.tsx`, `ThemeToggle.tsx` |
| ThemeToggle on landing page only (removed from login pages) | `src/app/page.tsx` |
| Auth context — session, profile, role, signOut, refreshProfile | `AuthProvider.tsx` |
| Middleware route protection — admin and account routes | `src/lib/supabase/middleware.ts` |
| Local dev fallback (no Supabase needed) | `AuthProvider.tsx`, login pages |
| 9 BI category components exist | `components/admin/bi/categories/` |
| Six CSV datasets present | `Dataset/` (and `Datasets/`) |
| Four database migrations present | `supabase/migrations/` |
| Brand assets present | `public/assets/branding/` |
| Cart state management | `components/cart/CartProvider.tsx` |
| Order history with receipt modal | `src/app/account/orders/page.tsx` |

### ⚠️ Implemented but Not Fully Verified

| Feature | Notes |
|---|---|
| Supabase auth in production | Supabase URL/key must be configured — dev uses local fallback |
| BI charts rendering with real data | Recharts components exist; data depends on Supabase connection |
| Checkout flow + place_order() RPC | RPC migration exists; end-to-end not confirmed without live DB |
| Profile display_name in Navbar | Code reads from `profiles` table; requires live Supabase |
| Pulse Rewards wallet | Page exists; point calculation depends on DB triggers |
| Admin dashboard sub-routes | Routes listed; pages exist but runtime not confirmed in this session |
| Customer register page | Linked from login (`/customer/register`) — existence not confirmed |

### 🔶 Partially Implemented

| Feature | Notes |
|---|---|
| Navbar — Store/8 Flavors/Pulse Rewards links | Navbar renders on all pages including login pages; may need suppression on login/landing routes |
| Admin operations (CRUD) | UI components present; Supabase mutations unverified |

### ❌ Not Implemented / Removed

| Feature | Notes |
|---|---|
| 3D interactive bottle/can viewer | Removed from UI by user request; Three.js package still installed |
| Realtime Supabase subscriptions | Not implemented |
| Payment gateway | No payment integration |

---

## E. Database Architecture

### Supabase Tables (from migration 001)

| Table | Purpose |
|---|---|
| `profiles` | User profile: `id` (FK → auth.users), `role` (admin/customer), `display_name`, `avatar_url` |
| `products` | 8 Vyra Pulse flavors: name, price, caffeine, description, stock |
| `customers` | Customer extended info (linked to `profiles`) |
| `orders` | Order header: customer_id, status, subtotal, discount, delivery_fee, total |
| `order_items` | Order line items: order_id, product_id, quantity, unit_price |
| `inventory` | Product stock levels |
| `offers` | Coupon codes and discount rules |

### Relationships
- `profiles.id` → `auth.users.id` (1:1)
- `orders.customer_id` → `profiles.id`
- `order_items.order_id` → `orders.id`
- `order_items.product_id` → `products.id`
- `inventory.product_id` → `products.id`

### Row Level Security (migration 002)
- Customers can only read/write their own orders, items, and profile
- Admins have elevated read access via service role in server-side operations
- Public can read products

### RPCs (migration 003)
- `place_order(...)` — atomic checkout: validates cart, applies discounts, creates order + items, updates inventory, credits Pulse Points

### Auth Triggers (migration 004)
- On new user signup → auto-creates `profiles` row with default role `customer`

### Canonical CSV Datasets (Dataset/ directory)
```
Dataset/customers.csv                  (600 records)
Dataset/demo_customer_credentials.csv  (600 demo accounts)
Dataset/inventory.csv                  (8 product inventory rows)
Dataset/offers.csv                     (8 promotional offers)
Dataset/order_items.csv                (1000 order item lines)
Dataset/orders.csv                     (1000 orders)
Dataset/products.csv                   (8 signature flavors)
```

### Migration Files
```
supabase/migrations/20261017000001_initial_schema.sql
supabase/migrations/20261017000002_rls_policies.sql
supabase/migrations/20261017000003_checkout_rpc.sql
supabase/migrations/20261017000004_auth_triggers.sql
supabase/seed.sql   ← full seed (run AFTER migrations)
```

---

## F. Authentication & Theme System

### Authentication Flow
1. Visitor lands on `/` (role-selection page)
2. Selects Admin → `/admin/login` or Customer → `/customer/login`
3. Login form submits credentials to Supabase `signInWithPassword()`
4. On success: fetches `profiles` table to verify `role`
5. Admin role → redirect to `/admin`; customer role → redirect to `/shop`
6. Middleware (`src/lib/supabase/middleware.ts`) enforces server-side role checks on every request to protected routes

### Local Dev Fallback (no Supabase)
- `isSupabaseConfigured()` returns `false` when env vars are missing/placeholder
- Admin login accepts `admin@gmail.com` + any password
- Customer login accepts `demo.customer@example.com` + any password
- Auth state stored in `localStorage` key `vyra-dev-auth`

### Role Verification
- Client-side: `useAuth()` → `profile.role`
- Server-side: middleware queries `profiles` table using validated Supabase session
- Never trust client-side role alone for sensitive operations

### Theme System
- `ThemeProvider` wraps entire app in `layout.tsx`
- Theme stored in `localStorage` key (check `ThemeProvider.tsx`)
- Toggles `dark` class on `<html>` element
- `ThemeToggle` button: Sun (switch to light) / Moon (switch to dark)
- **Theme toggle is only on the landing page** (`/`); removed from admin and customer login pages

### Profile Name in Navbar
- `Navbar.tsx` reads `profile.display_name` from `AuthProvider`
- Populated from `profiles.display_name` in Supabase
- Falls back to email if display_name is null

---

## G. BI Analytics Categories

All 9 categories have dedicated component files. Data fetching via Supabase in `src/lib/bi/`.

| Category | Component | Key Charts |
|---|---|---|
| A — Sales & Revenue | `CategoryASalesRevenue.tsx` | Revenue over time, daily sales, flavor breakdown |
| B — Profitability | `CategoryBProfitability.tsx` | Margin analysis, cost breakdown |
| C — Customer Analytics | `CategoryCCustomerAnalytics.tsx` | Cohort analysis, LTV, acquisition |
| D — Product Performance | `CategoryDProductPerformance.tsx` | Best sellers, flavor comparison |
| E — Regional Analytics | `CategoryERegionalAnalytics.tsx` | Geographic revenue distribution |
| F — Operational | `CategoryFOperationalAnalytics.tsx` | Fulfillment time, order status |
| G — Inventory | `CategoryGInventoryAnalytics.tsx` | Stock levels, reorder alerts |
| H — Marketing & Loyalty | `CategoryHMarketingLoyalty.tsx` | Coupon usage, Pulse Points |
| I — Customer Experience | `CategoryICustomerExperience.tsx` | Satisfaction, retention |

**Shared BI Infrastructure:**
- `BIFilterBar.tsx` — global date range, region, product filters
- `BIChartCard.tsx` — chart wrapper with export/expand toolbar
- `BIDrilldownModal.tsx` — drill-down detail modal
- `BICategoryNav.tsx` — tab navigation between A–I
- `BIUnavailableCard.tsx` — fallback when data is empty/unavailable

**Known Limitation:** All charts depend on Supabase connection. In dev without Supabase, charts will show empty/fallback states.

---

## H. Assets & UI Components

### Branding Assets
| File | Path |
|---|---|
| Main logo | `public/assets/branding/Logo.png` |
| Admin login background | `public/assets/branding/admin-login-bg.jpg` |
| Customer login background | `public/assets/branding/customer-login-bg.jpg` |
| 8-can hero image | `public/assets/products/Drinks.png` |

### 3D Viewer
- Three.js (`three`, `@types/three`) is still in `package.json` and `node_modules`
- The `src/components/3d/` directory exists
- **The viewer has been removed from all page UI** per user request
- Safe to uninstall `three` and `@types/three` if 3D is permanently dropped

### Custom UI Components
| Component | Location |
|---|---|
| Button | `src/components/ui/Button.tsx` |
| Card, CardHeader, CardContent | `src/components/ui/Card.tsx` |
| Badge | `src/components/ui/Badge.tsx` |
| ThemeToggle | `src/components/ui/ThemeToggle.tsx` |

---

## I. Environment Variables

**Never commit real values. Copy `.env.example` to `.env.local`.**

```env
# .env.local (never committed — covered by .gitignore)

# Supabase Public (safe in browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Server-only secret (NEVER expose in browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Find these values in your Supabase project:  
**Supabase Dashboard → Project Settings → API**

> ⚠️ `.env` and `.env*.local` are in `.gitignore`. Verify before any `git push`.

---

## J. Windows PowerShell Commands

```powershell
# Navigate to project
cd "d:\1 MY GODS\Vyra Pulse"

# Check Node.js and npm versions (Node 18+ required)
node --version
npm --version

# Install dependencies (uses existing lockfile)
npm ci

# Start development server
npm run dev
# → Opens at http://localhost:3000

# TypeScript type check
npm run typecheck

# ESLint
npm run lint

# Validate CSV data integrity
npm run validate
# (requires Python 3 in PATH)

# Seed the database (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
npm run seed

# Auth smoke test (requires Supabase configured)
npm run test:auth

# Production build (only when explicitly needed)
npm run build
npm run start
```

---

## K. Test Results

| Test | Status | Notes |
|---|---|---|
| `npm run typecheck` | ⬜ Not run in this session | Run after opening in VS Code |
| `npm run lint` | ⬜ Not run in this session | Run after opening in VS Code |
| `npm run validate` | ⬜ Not run in this session | Requires Python 3 |
| `npm run test:auth` | ⬜ Not run in this session | Requires live Supabase |
| `npm run build` | ⬜ Not run in this session | Run before any deployment |
| Dev server (`npm run dev`) | ✅ Running at time of handover | Was running for 20+ minutes |
| Role-selection landing page | ✅ Renders in browser | Visual confirmed |
| Customer login page | ✅ Matches reference image | Visually confirmed |
| Admin login page | ✅ Renders with artwork | Visually confirmed |
| BI charts with Supabase | ⬜ Unverified | Requires live DB connection |

> **IMPORTANT:** No automated test suite is configured. TypeScript type errors, lint warnings, and build errors have not been systematically checked in this session. **Run `npm run typecheck` and `npm run lint` as your first steps in VS Code.**

---

## L. Deployment Status

| Environment | Status |
|---|---|
| Local development | ✅ Working — `npm run dev` runs at `http://localhost:3000` |
| Supabase cloud DB | ⬜ Connection not verified in this session — requires `.env.local` |
| Vercel / public deployment | ❌ Not deployed — no `vercel.json`, no deployment configured |
| Git repository | ❌ **No `.git` directory** — project is NOT under version control |

> ⚠️ **Critical:** The project has no Git repository. You should initialize one in VS Code before making any changes. See Section O below.

---

## M. Prioritized Unfinished Work

1. **Initialize Git** — `git init` + initial commit before any VS Code changes
2. **Configure Supabase** — create `.env.local` with real credentials, run migrations, run seed
3. **TypeScript + lint pass** — `npm run typecheck` + `npm run lint` — fix any errors
4. **Suppress Navbar on login/landing pages** — Navbar currently renders on `/`, `/admin/login`, `/customer/login` showing Store/8 Flavors/Pulse Rewards links, which is undesirable
5. **Customer register page** — `/customer/register` is linked from the login page but existence is unconfirmed
6. **Verify BI charts end-to-end** — connect Supabase and confirm all 9 categories render with real data
7. **Production build validation** — `npm run build` must pass before any deployment
8. **Remove Three.js if 3D is permanently dropped** — saves ~2MB from bundle

---

## N. Next Single Task for VS Code

> **Initialize Git and configure Supabase**
> 1. `git init` in the project root
> 2. `git add .` then `git commit -m "initial commit"`
> 3. Copy `.env.example` to `.env.local` and fill in Supabase credentials
> 4. Run `npm run typecheck` — fix any type errors that surface

---

## O. VS Code Setup Instructions

### 1. Open the project
```
File → Open Folder → select "d:\1 MY GODS\Vyra Pulse"
```

### 2. Open the integrated terminal
```
Terminal → New Terminal   (or Ctrl + `)
```

### 3. Check environment
```powershell
node --version     # must be 18.x or higher
npm --version      # must be 8.x or higher
git --version      # optional but recommended
```

If Node is missing: download from https://nodejs.org (LTS version)

### 4. Install dependencies
```powershell
npm ci
```
This uses the existing `package-lock.json` — do NOT run `npm install` as it may update packages.

### 5. Configure environment variables
```powershell
Copy-Item .env.example .env.local
# Then open .env.local in VS Code and fill in:
# NEXT_PUBLIC_SUPABASE_URL  → from Supabase Dashboard → Project Settings → API
# NEXT_PUBLIC_SUPABASE_ANON_KEY  → from same page
# SUPABASE_SERVICE_ROLE_KEY  → from same page (keep secret)
# NEXT_PUBLIC_SITE_URL  → http://localhost:3000
```

### 6. Start the development server
```powershell
npm run dev
```

### 7. Open the app
Navigate to `http://localhost:3000` in your browser.

### 8. Run validation scripts
```powershell
npm run typecheck      # TypeScript errors
npm run lint           # ESLint warnings/errors
npm run validate       # CSV data validation (requires Python 3)
```

### 9. Common startup errors

| Error | Fix |
|---|---|
| `Cannot find module '...'` | Run `npm ci` |
| Port 3000 in use | `npm run dev -- --port 3001` |
| Supabase: "relation does not exist" | Run migrations in Supabase SQL editor, then `npm run seed` |
| `isSupabaseConfigured()` returns false | Check `.env.local` — values must not be placeholders |
| Auth redirects to login constantly | Check middleware; verify Supabase session cookies |
| Charts show no data | Supabase not connected or tables empty — run seed |
| TypeScript errors on build | Run `npm run typecheck` and fix reported errors |

---

## P. Initialize Git (Do This First in VS Code)

The project currently has **no Git repository**. Run these commands immediately:

```powershell
cd "d:\1 MY GODS\Vyra Pulse"

# Initialize repository
git init

# Verify .gitignore is correct (should exclude .env, node_modules, .next)
cat .gitignore

# Stage all files
git add .

# Verify no secrets are staged
git status

# Initial commit
git commit -m "feat: initial Vyra Pulse project — role-selection landing, dual login pages, 9 BI categories"
```

> ⚠️ Before `git add .`, confirm `.env.local` (if it exists) is listed in `.gitignore`. It should be — `.env` and `.env*.local` are both excluded.
