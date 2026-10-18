# VYRA PULSE — MASTER PROJECT README & ANTIGRAVITY BUILD PROMPT

> **Purpose:** This is the single canonical instruction document to provide to Antigravity together with the existing Vyra Pulse repository, UI/master prompt, database prompt, brand logo/product images, and six CSV seed datasets.
>
> **Product name:** Always write **Vyra Pulse**. Never write “Vyra Plus”.
>
> **Build strategy:** Inspect first, preserve the existing UI, implement in phases, test each phase, and deploy only after verification.

---

## 1. MASTER INSTRUCTION TO ANTIGRAVITY

You are the lead full-stack engineer, database architect, application-security engineer, Business Intelligence engineer, and UI implementation agent for **Vyra Pulse**, a premium energy-drink e-commerce and cloud BI platform.

Your task is to inspect and extend the existing project into a functional, cloud-hosted application. The existing UI, product branding, product lineup, logo, animations, and supplied prompts are important source material. Do not rebuild or replace working features without first inspecting them and explaining why a change is needed.

### First action — inspect before coding

Before editing files:

1. Inspect the repository, folder structure, `package.json`, framework/version, current routes, components, styles, assets, environment setup, existing database integration, and current deployment configuration.
2. Inspect every supplied project prompt, README/specification, product logo/image, and CSV dataset.
3. Identify which features are already implemented, which use mock/hardcoded data, and which are missing.
4. Check the supplied CSV headers and data relationships before designing or changing the database schema.
5. Produce a short implementation audit and proposed sequence.
6. Do not delete files, replace the existing UI, reset a database, overwrite production data, or run destructive commands without explicit approval.
7. After the audit, proceed phase by phase. If a required secret, external permission, or important business decision is missing, ask for it rather than inventing it.

Do not stop after producing plans and code snippets: implement, run available checks, test the flows, and report the actual results. Do not claim a feature works unless it has been verified.

---

## 2. PROJECT OBJECTIVE

Build a single responsive web application with:

- A premium Vyra Pulse landing/store experience.
- A separate administrator login and protected admin dashboard.
- A customer login/registration and protected customer account.
- One shared Supabase PostgreSQL database with permissions separating administrator and customer access.
- Real product, cart, checkout, order, inventory, offer, and loyalty operations.
- Database-backed Business Intelligence charts and metrics.
- Real-time new-order notifications in the admin dashboard.
- A global dark/light theme toggle.
- Cloud deployment using Vercel and Supabase.
- Setup instructions, SQL migrations, seed scripts, tests, and deployment documentation.

The target outcome is a deployed Vercel URL such as `https://<your-project>.vercel.app/admin`. This is an example URL format, not a claim that a deployment already exists.

### Definition of a successful MVP

At minimum, a customer must be able to sign in, view database-backed products, place a valid order, and see the saved order in their account. The order must be stored in PostgreSQL, stock and eligible loyalty records must update consistently, and the admin must be able to see the order and receive a live notification. Relevant BI metrics must reflect the saved transaction. Both roles must be securely separated.

---

## 3. APPROVED TECHNOLOGY STACK

Prefer the following stack unless the existing repository already uses a compatible framework that should be preserved:

- **Application framework:** Next.js App Router
- **Frontend:** React and TypeScript
- **Styling:** Tailwind CSS and the existing design system; shadcn/ui where useful
- **Product visuals:** Existing supplied product images and 3D assets; Three.js / React Three Fiber / Drei where already implemented or justified
- **Motion:** Motion for React where useful
- **Charts:** Recharts
- **Cloud database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **Authorization:** Server-side role checks and Supabase Row Level Security (RLS)
- **Live updates:** Supabase Realtime
- **Image storage:** Supabase Storage where required
- **Hosting:** Vercel
- **Version control:** Git and GitHub

Do not introduce a new framework or a large set of dependencies without a clear reason. Use the package manager already indicated by the repository lockfile.

### Architecture rule

Supabase PostgreSQL is the source of truth for all persistent business data. CSV files are only for initial seeding, development, and repeatable demos; they are not the live database.

Use server-side code or secure PostgreSQL functions for checkout, pricing, promotions, stock reservation, loyalty updates, and other multi-step operations. Do not rely on a series of independent browser inserts for transactions that must remain consistent.

---

## 4. BRAND, PRODUCT LINEUP, AND DESIGN SYSTEM

Preserve the supplied Vyra Pulse logo and product images. Do not replace them with unrelated stock images. Confirm the asset paths and map each image to the correct product.

### Visual direction

- Primary style: premium, futuristic energy-drink brand.
- Dark theme: black and charcoal backgrounds, white typography, neon-lime accents, subtle borders, refined shadows, and restrained glow.
- Light theme: clean off-white/light neutral surfaces, readable dark typography, the same neon-lime brand accent, and appropriate contrast.
- Flavor-specific accent colors should be retained where they match the supplied product designs.
- Use clear typography, deliberate spacing, responsive layouts, polished cards, useful motion, and accessible focus states.
- Avoid excessive glow, clutter, unnecessary animation, or decorative charts that distract from the business data.

### Eight initial products

Use the following initial product catalogue and preserve the spelling:

1. Vyra Pulse Citrus Charge — Citrus (Lemon-Lime)
2. Vyra Pulse Blueberry Blast — Blueberry
3. Vyra Pulse Mango Fusion — Mango
4. Vyra Pulse Watermelon Rush — Watermelon
5. Vyra Pulse Grape Surge — Grape
6. Vyra Pulse Pink Guava Spark — Guava
7. Vyra Pulse Icy Mint Freeze — Mint
8. Vyra Pulse Peach Boost — Peach

The supplied product image indicates a 330 ml can and a displayed price of ₹149 for the initial eight products. Verify these values against the supplied dataset/specification before seeding. Do not invent verified formulations, health claims, caffeine values, or ingredients; use only supplied data and clearly label demo assumptions.

### Dark/light theme

Implement a real global theme toggle across landing, login, admin, customer, dialogs, menus, tables, and charts. Persist the preference appropriately and avoid an initial flash of the wrong theme. Test both themes on desktop and mobile. Respect reduced-motion preferences and provide fallbacks if WebGL is unavailable.

---

## 5. APPLICATION ROUTES AND ROLE SEPARATION

Use route names compatible with the existing project. A possible route structure is:

- `/` — brand landing page / portal entry
- `/admin/login` — administrator login
- `/admin` — protected admin overview
- `/admin/products` — product management
- `/admin/orders` — order management
- `/admin/customers` — customer directory and purchase analytics
- `/admin/inventory` — stock and inventory movements
- `/admin/offers` — offer management
- `/admin/analytics` — business intelligence and reports
- `/login` or `/customer/login` — customer login
- `/register` or `/customer/register` — customer registration
- `/shop` — product catalogue
- `/cart` — shopping cart
- `/checkout` — checkout
- `/account/orders` — customer order history
- `/account/wallet` — loyalty wallet and rewards
- `/account/profile` — customer profile and addresses

Do not duplicate route structures unnecessarily if the repository already has a coherent equivalent.

### Admin access

The intended demo admin identity is `admin@gmail.com`; the requested demo password is `admin123`. Treat these as development/demo requirements only. Provision the account through Supabase Auth and assign its role through a secure server-side process or controlled administrative setup.

- Do not hardcode an email/password comparison in frontend code.
- Do not create an admin account merely because a visitor types the email.
- Do not grant admin privileges based on a role selector, URL, local storage, or user-editable metadata.
- Do not put a plaintext password in a CSV, source code, README, Git history, or database profile.
- If demo credentials are configured, keep them out of public production documentation and rotate them before public use.
- If the account cannot be created securely without a secret or dashboard action, document the exact manual setup step.

### Customer accounts

Use Supabase Auth for sign-up, login, logout, session handling, and recovery. The requested pattern `name@gmail.com` with password `name123` may be used only for explicitly synthetic local/demo accounts; it must not become a predictable production password policy. Create Auth users separately from customer data rows and link them through a stable ID. A CSV customer record by itself is not an authenticated account.

### Authorization

- Enforce role checks on the server and in database RLS policies.
- Customers can access only their own profile, addresses, orders, order items, wallet, and loyalty transactions.
- Customers cannot update prices, inventory, offers, order totals, roles, or audit logs directly.
- Admin-only operations must be protected beyond hiding buttons or routes.
- Never expose the Supabase service-role key or database password in browser code.
- Never trust client-submitted price, discount, order total, reward balance, or payment status.

---

## 6. DATABASE AND CSV SEED REQUIREMENTS

Inspect the actual supplied CSV files and the supplied Database Prompt before writing migrations. Preserve agreed column names when practical. If there is a conflict, explain it and recommend one canonical schema before making changes.

### Six primary CSV datasets

| CSV | Initial target | Purpose |
|---|---:|---|
| `products.csv` | 8 | Product catalogue and current selling details |
| `customers.csv` | 100 | Synthetic customer profiles and delivery-region attributes |
| `orders.csv` | 100 | Synthetic historical orders, timestamps, delivery region, totals, and statuses |
| `order_items.csv` | 150–250 | Products and quantities purchased in each order |
| `inventory.csv` | 8 | Initial stock and reorder thresholds |
| `offers.csv` | 5 | Initial promotional offers |

Use the supplied datasets if present. Do not regenerate or silently replace them without checking them first. If a dataset is missing, report that and create it only as a clearly documented synthetic seed file.

### Required relationships

- Every order references a valid customer.
- Every order item references a valid order and product.
- Every order has at least one item.
- Inventory references valid products.
- Offer codes are unique.
- Order totals reconcile with item quantities, historical prices, discounts, and delivery fees according to one documented policy.
- Seeded IDs remain stable across repeated seed runs.
- Seed scripts are idempotent and do not duplicate records when rerun.
- All demo records are synthetic and must be labelled as demo data.
- Do not include passwords or real personal data in seed files.

### Core tables

Create or adapt the following tables as needed:

- `profiles` — link `auth.users` to a role and display name.
- `customers` — customer identity and permitted contact/region fields.
- `products` — product name, flavor, ingredients supplied by the owner, caffeine amount if provided, volume, price, active status, image path, timestamps.
- `orders` — customer, timezone-aware order timestamp, delivery-address snapshot, subtotal, discount, delivery fee, final total, order status, payment status, timestamps.
- `order_items` — order/product references, quantity, historical unit price, line total, product-name/flavor snapshots.
- `inventory` — authoritative stock on hand, reorder threshold, location, timestamp.
- `offers` — unique code, offer type/value, minimum order, validity, activation, eligibility and redemption limits.
- `addresses` — customer delivery addresses.
- `loyalty_wallets` — available balance, linked to customer.
- `loyalty_transactions` — append-only-style ledger of earned, redeemed, reversed, or adjusted points.
- `promotion_redemptions` — record offer use and associated order/customer.
- `inventory_movements` — stock changes, reason, actor, timestamp, and related order where applicable.
- `audit_logs` — important administrative changes.
- `store_settings` — configurable delivery, reward, and store policies.
- `product_costs` or equivalent — unit costs for profitability calculations if supplied.
- `payment_records` if payment integration is implemented; never store raw card numbers or security codes.

Add appropriate primary keys, foreign keys, check constraints, unique constraints, indexes, and timestamps. Use a suitable exact numeric type for currency rather than floating-point arithmetic.

### Inventory rules

- The `inventory` table is the authoritative source for stock.
- Do not independently maintain conflicting stock quantities in both products and inventory.
- Stock cannot become negative.
- Prevent overselling during concurrent orders using transaction-safe SQL logic, conditional updates, or appropriate row locking.
- Record stock movement for sales, cancellations, returns, restocking, and manual adjustments.
- Define when a cancelled order releases stock.
- Avoid duplicate stock deductions or restocking on retries.
- Derive low-stock status from stock on hand and reorder threshold.

### Historical integrity

Store the purchased price, quantity, and product description on each finalized order item. A future product price change must not rewrite historical orders.

### Migrations and seeds

Provide version-controlled SQL migrations, a reproducible seed process, validation queries, import instructions, and a README. Never drop or overwrite production tables as part of a normal seed operation. Separate development reset instructions from production deployment.

---

## 7. CUSTOMER E-COMMERCE FEATURES

Implement and connect the following to the real database:

### Storefront
- Responsive home page with supplied branding and product imagery.
- Product catalogue for all active products.
- Product detail views with price, volume, ingredients/specifications that have been supplied, and availability.
- Search, filtering, and sorting.
- Product quantity selection and cart.
- Cart persistence appropriate to the current user/session.
- Checkout with delivery address and a clear price breakdown.
- Order confirmation using the saved order record.
- Order history and order status.
- Profile and address management.
- Loyalty wallet and rewards.
- Active offer visibility and eligible delivery promotions.

### Secure checkout

Checkout must use trusted server-side logic or a PostgreSQL function/transaction to:

1. Authenticate the customer.
2. Load current product prices from PostgreSQL.
3. Verify that products are active and quantities are valid.
4. Verify stock availability.
5. Validate coupon and promotion eligibility.
6. Calculate subtotal, discounts, delivery fee, and final amount server-side.
7. Create the order and order items atomically.
8. Reserve/deduct stock atomically.
9. Record inventory movements and promotion redemption as appropriate.
10. Award loyalty points only according to the defined order eligibility policy.
11. Return the confirmed order to the customer.
12. Trigger/enable admin notification and refresh relevant BI queries.

Make order creation idempotent so a network retry cannot create duplicate orders. Prevent partial orders and inconsistent inventory. If a full payment provider is not configured, label checkout as a demo/unpaid flow and do not falsely claim real payment processing.

---

## 8. ADMIN DASHBOARD FEATURES

Build a premium, responsive admin command center with a sidebar, top navigation, search, notifications, account menu, and theme toggle.

### A. Executive overview
Use database-backed values for:

- Total eligible net sales.
- Total orders and completed orders.
- Registered customers.
- Average order value.
- Units sold.
- Revenue change compared with a previous period.
- Low-stock product count.
- Gross profit/margin only if valid product cost data is available.

Add date filters such as today, 7 days, 30 days, and a custom range where practical. Clearly define treatment of cancelled, unpaid, and refunded orders.

### B. Order management
Show:

- Order ID.
- Customer ID and permitted customer details.
- Product names and quantities.
- Order timestamp and weekday.
- Delivery city, state, postal code, and address details appropriate for fulfilment.
- Subtotal, discount, delivery fee, and final amount.
- Payment status and order status.

Support search, sorting, filtering, order details, and valid status transitions. Log important administrative status changes. Do not let an admin status update falsely confirm payment.

### C. Customer intelligence
Show:

- Highest-spending customer in the selected period.
- Total spend and order count per customer.
- Average order value.
- First-time versus returning customers.
- Purchase history and loyalty balance.
- Repeat-purchase metrics.

Use a documented definition for “highest-purchasing customer”; default to highest eligible net spend, with order count displayed separately.

### D. Product analytics
Show top- and lowest-selling flavors, revenue by flavor, units sold by product, trends over time, and product performance. Distinguish units sold from revenue.

### E. Regional analytics
Use delivery city/state/postal-code fields to calculate orders and sales by region. Show the highest-order and lowest-order regions for the selected period, with counts and revenue. Avoid misleading conclusions for regions with missing or insufficient data. Use a map only if the geographic data supports it; otherwise use a ranked bar chart.

### F. Product management
Allow authorized admin users to add, edit, activate/deactivate, and update product details, price, image reference, and availability. Changes must persist in PostgreSQL and appear in the storefront. Preserve historical order snapshots.

### G. Inventory management
Show current stock, low/out-of-stock products, reorder thresholds, stock movements, restocking actions, and inventory value if unit costs are available.

### H. Offers and promotion management
Allow authorized admins to create, edit, activate/deactivate, and expire offers. Validate codes, thresholds, dates, usage limits, and eligibility on the server. Track redemption and discount cost.

### I. Reports
Where practical, provide permitted CSV exports for orders, sales, inventory, customers, and promotion performance. Protect personal data and never export secrets.

---

## 9. SIX CONFIGURABLE LOYALTY OFFERS

Implement the six proposed offers below as configurable database-backed rules. Do not hardcode reward logic in multiple UI components.

1. **Pulse Starter:** award 10 points per eligible can purchased. Award only when the order satisfies the agreed fulfilment/payment eligibility policy.
2. **Free Delivery:** free delivery for qualifying orders above ₹445 and eligible first orders. Store the threshold and policy in settings or offer records.
3. **Triple Charge:** award a bonus for a qualifying order containing three eligible cans.
4. **Pulse Streetwear:** unlock a free branded hoodie at 400 points or more, subject to stock and eligibility.
5. **The 800 Club:** redeem 800 points for one eligible drink reward worth up to ₹200. Show eligible products and any price excess clearly.
6. **Pulse Elite:** at 1,200 points, unlock a configurable higher-tier reward, such as a multi-can discount or early access to a new flavor.

These are proposed demo business rules and must be configurable. Confirm the exact points-awarded bonus for Triple Charge and any reward redemption costs in one central configuration rather than silently inventing extra values.

### Loyalty integrity

- Store wallet balances in the database.
- Keep a transaction ledger for all credits, debits, reversals, and administrative adjustments.
- Customers cannot directly edit points.
- Prevent duplicate awards during checkout retries.
- Redeem points and reserve rewards atomically.
- Enforce eligibility, limits, and reward availability.
- Define how refunds/cancellations reverse earned points.
- Record reward redemptions for BI.
- Do not show a reward as available if the server says it is unavailable.

---

## 10. LIVE ADMIN ORDER NOTIFICATIONS

Use Supabase Realtime to notify the admin dashboard about new orders and relevant status changes.

When a customer order is committed:

- Display a visible in-app notification.
- Show order ID, customer ID, item count/items, amount, delivery region, and order timestamp.
- Refresh the admin order list and relevant KPI queries.
- Avoid duplicate notifications.
- Remove subscriptions when components unmount.
- Handle reconnects and missed events by refetching authoritative database state.
- Apply RLS/authorization to all subscribed data.

Realtime is a notification mechanism, not the permanent record. PostgreSQL remains authoritative. Do not display sample values as real live transactions.

---

## 11. BUSINESS INTELLIGENCE REQUIREMENTS

All charts and KPI cards must be connected to database-backed queries or secure server endpoints. No hardcoded dashboard totals, fabricated growth percentages, or decorative placeholder data in the final working flow.

Implement where the available data supports it:

- Daily, weekly, and monthly sales.
- Revenue by product/flavor.
- Units sold by product/flavor.
- Sales and order counts by city/state.
- Highest- and lowest-order regions.
- Highest-spending customers.
- Average order value.
- Order status distribution.
- New versus returning customers.
- Repeat-purchase rate.
- Promotion use, discounts, and promotion-linked revenue.
- Stock on hand, low stock, and out-of-stock items.
- Inventory value and gross margin only when valid costs exist.
- Loyalty points earned/redeemed and reward usage.
- Period-over-period comparison.

Use server-side aggregation and pagination. Do not fetch entire tables into the browser merely to calculate totals. Index common filters and foreign keys.

Document the business definitions for revenue, net sales, refunds, completed orders, repeat customers, and promotion performance. Keep the definitions consistent across KPI cards and charts.

Synthetic historical data is for demonstration and testing. Clearly label it as demo data. New user-created orders should be stored and processed dynamically, not appended to CSV files.

---

## 12. REALTIME PRODUCT AND OFFER UPDATES

When an admin updates a price or product:

- Validate the input.
- Save it to PostgreSQL.
- Update timestamps.
- Write an audit entry.
- Refresh the relevant product query/subscription.
- Display the current price in the customer storefront.
- Use the new price for future orders only.
- Preserve historical order prices.

When an admin updates an offer:

- Save and validate its rule, date range, and activation status.
- Refresh the customer-visible offers.
- Reject expired/inactive offers at checkout.
- Preserve redemption history.
- Update promotion analytics.

Do not use hardcoded product prices or offers as the source of truth.

---

## 13. SECURITY AND ENVIRONMENT CONFIGURATION

Enable RLS on all tables exposed through Supabase APIs and write explicit policies.

Use environment variables for configuration. Client-side configuration may include the Supabase project URL and publishable/anon key as appropriate for the current Supabase setup. Privileged keys and database credentials must remain server-side.

Provide an `.env.example` with placeholder values only, for example:

- `NEXT_PUBLIC_SUPABASE_URL=`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=` or the appropriate publishable-key variable used by the project
- Server-only secrets only where required, with placeholder names and no actual values

Never commit `.env.local`, real credentials, service-role keys, passwords, or database URLs containing secrets. Check `.gitignore` and Git history as appropriate. Do not paste secrets into AI prompts. Use Vercel and Supabase dashboards to configure production values.

Before public deployment:

- Rotate any demo credentials that have been exposed.
- Use server-verified roles and RLS.
- Test that customer A cannot read or modify customer B’s records.
- Test that a customer cannot access admin operations.
- Test that customers cannot change prices, order totals, stock, roles, or loyalty balances.
- Avoid exposing unnecessary personal data in admin notifications and exports.
- Do not store raw payment card details.

---

## 14. DATA SEEDING AND VALIDATION

For the initial seed, target:

- Products: 8
- Customers: 100
- Orders: 100
- Order items: 150–250
- Inventory: 8
- Offers: 5

Use supplied CSV files as the source when they exist. Before importing:

1. Validate column headers and data types.
2. Check unique IDs and foreign-key integrity.
3. Verify each order has at least one item.
4. Recalculate line totals and order totals.
5. Check dates, statuses, quantities, and coupon uniqueness.
6. Reconcile inventory seed values with the inventory table.
7. Check that all product image paths point to the correct supplied assets.
8. Document synthetic data and seed instructions.

Do not assume that imported customer records have corresponding Supabase Auth accounts. Explain how a demo user is provisioned and linked to a customer profile.

---

## 15. IMPLEMENTATION PHASES

Work incrementally. Finish and verify each phase before moving to the next.

### Phase 0 — Audit and plan
- Inspect the current repository and assets.
- Read all supplied prompts and datasets.
- Report current state, conflicts, missing dependencies, and risks.
- Propose a phased plan.
- Preserve existing functionality.

### Phase 1 — Foundation and cloud database
- Confirm the app builds locally.
- Configure Supabase environment variables.
- Create SQL migrations, constraints, indexes, RLS, and supporting tables.
- Import/seed and validate the six datasets.
- Connect the existing product catalogue to the database.

### Phase 2 — Authentication and roles
- Implement admin/customer login and logout using Supabase Auth.
- Provision admin role securely.
- Protect server routes and data access.
- Test customer isolation.
- Implement and test global dark/light theme.

### Phase 3 — Customer ordering
- Connect products, cart, checkout, address handling, and order history.
- Implement server-side validation and transaction-safe order creation.
- Update inventory and movement history.
- Add idempotency and error handling.
- Clearly label checkout if real payment integration is not configured.

### Phase 4 — Admin operations
- Connect order management, customer analytics, product editing, inventory, and offer management.
- Add validation, audit logs, and safe status transitions.

### Phase 5 — BI and realtime
- Replace mock charts and KPIs with database-backed queries.
- Implement regional and highest-customer analysis.
- Add authorized Supabase Realtime notifications.
- Verify that a new order updates the correct metrics.

### Phase 6 — Loyalty
- Implement wallet, transaction ledger, reward eligibility, redemption, and reversal rules.
- Test duplicate requests and insufficient balances.

### Phase 7 — Polish and deployment
- Test responsive layouts and both themes.
- Optimize existing 3D visuals; keep fallbacks.
- Run build, lint, type checks, and relevant tests.
- Configure Vercel production environment variables.
- Deploy and verify the actual production URL.
- Update README with setup, schema, seeding, authentication setup, deployment, limitations, and testing results.

### One-day MVP priority

If time is limited, prioritize:
1. A working Supabase connection and schema.
2. Secure admin/customer authentication.
3. A complete customer order-to-admin visibility flow.
4. Inventory consistency.
5. Database-backed core BI and regional/top-customer analytics.
6. Vercel deployment.
7. Loyalty and advanced animation refinements after the core flow works.

Do not claim a complete production-grade implementation in one day unless it has actually been completed and tested.

---

## 16. REQUIRED TESTS AND ACCEPTANCE CRITERIA

The project is not complete merely because pages render.

### Database and seed tests
- All required tables and relationships exist.
- All six datasets import and validate.
- Re-running the seed script does not duplicate records.
- Every order references a valid customer.
- Every order item references a valid order/product.
- Totals reconcile according to the documented calculation policy.

### Authentication/security tests
- Admin login and logout work.
- Customer login and logout work.
- Unauthorized users cannot access admin operations.
- Customer data is isolated by RLS.
- Users cannot assign themselves admin privileges.
- No privileged keys are exposed in client bundles.

### Order/inventory tests
- A valid order is persisted and visible after refresh.
- Invalid quantities and inactive products are rejected.
- Prices and discounts are calculated server-side.
- Stock cannot become negative.
- Concurrent orders cannot oversell the same stock.
- Retried checkout does not create duplicate orders.
- Cancellation/refund behavior follows the documented stock and loyalty policy.
- Historical order-item prices remain unchanged after product price updates.

### Realtime/BI tests
- The admin sees a new order notification.
- The order list refetches authoritative database data.
- New orders update the relevant counts and charts.
- Regional rankings use actual saved delivery-region fields.
- Highest-spending customer metrics use the documented calculation.
- Cancelled/unpaid/refunded orders are handled consistently.

### UI/deployment tests
- Dark/light theme works across the app.
- Product images load correctly.
- Layout works on desktop and mobile.
- Build and type checks pass.
- Production environment variables are set.
- The deployed Vercel URL is tested with real cloud requests.

If a test cannot be run due to missing credentials, external access, or setup, state that explicitly and provide the exact remaining manual step.

---

## 17. REQUIRED PROJECT DOCUMENTATION

Create or update:

- `README.md` — project overview, prerequisites, local setup, environment variables, development commands, seed process, testing, deployment, and known limitations.
- SQL migration files — version-controlled schema and policies.
- Seed script(s) — repeatable and safe for development.
- `.env.example` — placeholder variable names only.
- `DATABASE_SPEC.md` or equivalent — canonical schema and relationship documentation if not already supplied.
- Tests for critical database and business logic where practical.

Do not create several conflicting README files that independently redefine the same requirements. Keep this master README as the main project guide and reference the existing detailed UI/database prompts when appropriate.

---

## 18. WORKING RULES FOR THE CODING AGENT

- Preserve existing code and assets unless a change is necessary.
- Inspect before modifying.
- Work in small, verifiable phases.
- Prefer readable, typed, reusable modules over giant components.
- Do not hardcode production metrics, credentials, roles, prices, or reward balances.
- Use database queries for persistent state and BI.
- Use server-side authorization and database RLS.
- Do not invent business data and present it as real.
- Do not claim tests passed unless they were actually run.
- Do not claim deployment succeeded until the production URL is available and checked.
- Explain important schema or business-rule changes before making them.
- Ask before destructive actions or changes that may affect production data.
- At the end of each phase, report files changed, commands run, test results, what works, what does not work, and the next phase.
- Keep the user informed without flooding them with unnecessary status messages.

---

## 19. FIRST TASK TO EXECUTE NOW

**Do not immediately build everything.**

1. Inspect the existing repository and supplied files.
2. Read this README and the original UI and database prompts.
3. Inspect the product logo/images and six CSV datasets, if present.
4. Produce an implementation audit and list any conflicts or missing inputs.
5. Recommend the smallest safe first implementation phase.
6. Wait for approval before destructive changes or any action requiring missing credentials.
7. Once approved, begin Phase 1 and verify it before moving forward.

**Final objective:** Deliver a secure, premium, responsive, cloud-hosted Vyra Pulse e-commerce and Business Intelligence platform using the existing design, a shared Supabase PostgreSQL database, genuine customer/admin workflows, live order notifications, reliable loyalty logic, and database-backed analytics.
