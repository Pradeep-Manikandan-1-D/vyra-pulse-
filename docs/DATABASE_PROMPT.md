# VYRA PULSE — Detailed Database & Backend Implementation Prompt

## 1. Role and Objective

Act as a senior database architect, Supabase/PostgreSQL engineer, backend developer, and Business Intelligence engineer.

Implement the complete database and backend functionality for **Vyra Pulse**, an energy drink e-commerce and Business Intelligence platform.

The frontend UI, visual design, animations, login pages, and 3D product visuals have already been designed. Do not redesign, replace, or unnecessarily modify the existing UI.

Your responsibility is exclusively to implement the database architecture, data models, authentication integration, business logic, real-time synchronization, data validation, security, and BI queries.

### Existing technology stack

- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- File storage: Supabase Storage
- Real-time updates: Supabase Realtime
- Frontend integration: React, TypeScript, and the existing application framework
- Database client: Supabase JavaScript client
- Validation: TypeScript-compatible schema validation
- Deployment: Vercel and Supabase

Inspect the existing repository before making changes. Reuse existing components, environment variables, authentication logic, and project structure wherever possible.

---

## 2. Required Database Structure

Use six initial CSV datasets as the source of synthetic seed data:

1. `products.csv`
2. `customers.csv`
3. `orders.csv`
4. `order_items.csv`
5. `inventory.csv`
6. `offers.csv`

Import these records into six corresponding PostgreSQL tables.

Additionally, create supporting tables when required for secure authentication profiles, inventory history, promotion usage, audit logs, addresses, and other operational requirements.

Do not treat CSV files as the live database. They are only for initial seeding, testing, and reproducible development.

PostgreSQL must become the single source of truth for all application data.

## 3. Products Table

Create a `products` table based on the existing `products.csv` structure.

Required fields:

- `product_id`: primary key.
- `product_name`: product display name.
- `flavor`: flavor name.
- `key_ingredients`: ingredient description.
- `caffeine_mg_per_330ml`: caffeine content per 330 ml.
- `volume_ml`: can volume.
- `price_inr`: current selling price.
- `is_active`: product availability.
- `stock_quantity`: initial stock quantity from the CSV.
- `image_url`: product image reference.
- `created_at`: record creation timestamp.
- `updated_at`: last modification timestamp.

Use suitable data types, constraints, and indexes.

Requirements:

1. Seed exactly eight initial products:
   - Citrus Charge
   - Blueberry Blast
   - Mango Fusion
   - Watermelon Rush
   - Grape Surge
   - Pink Guava Spark
   - Icy Mint Freeze
   - Peach Boost

2. Store the eight actual product images in Supabase Storage and associate each image with the correct product.

3. Use stable product IDs and prevent duplicate product records during repeated seed operations.

4. Allow the Super Admin to create, edit, activate, deactivate, and update product prices.

5. Validate prices, volumes, and ingredient fields.

6. Never use an inactive product for a new order.

7. Existing orders must retain their original purchased item descriptions and prices even when product information changes.

8. Avoid maintaining independently editable stock quantities in both `products` and `inventory`. Treat the inventory table as the authoritative source for stock, and expose stock information to the UI through a consistent query or view.

If compatibility requires retaining `stock_quantity` in the original CSV, treat it as an initial seed value and migrate it into inventory during seeding.

---

## 4. Customers and Authentication

Create a `customers` table corresponding to `customers.csv`.

Required fields:

- `customer_id`: primary key.
- `first_name`.
- `last_name`.
- `email`: unique.
- `phone`.
- `city`.
- `state`.
- `postal_code`.
- `registered_at`.

Create an associated `profiles` table linked to `auth.users` for authenticated application users.

The profiles table should contain:

- `user_id`: references `auth.users.id`.
- `role`: `admin` or `customer`.
- `display_name`.
- `created_at`.
- `updated_at`.

### Authentication requirements

- Use Supabase Auth for account creation, login, logout, and password recovery.
- Do not store passwords in the customers table.
- Do not store plain-text passwords in any database table or CSV file.
- Link authenticated customer accounts to customer records using a stable relationship.
- Do not assume that synthetic customer records automatically correspond to real authenticated accounts.
- Prevent customers from accessing other customers' profiles, addresses, or orders.
- Provision the Super Admin role through a secure server-side process.
- Never permit users to assign themselves the admin role.
- Never expose a Supabase service-role key to the browser.

The single Super Admin must be able to manage products, prices, inventory, offers, orders, and business analytics.

Customers may view and manage only the information and operations permitted for their own accounts.

---

## 5. Orders Table

Create an `orders` table based on `orders.csv`.

Required fields:

- `order_id`: primary key.
- `customer_id`: foreign key to customers.
- `ordered_at`: timestamp with timezone.
- `order_day`: weekday derived from the order timestamp for analytics.
- `order_time_local`: local display time, derived where appropriate.
- `delivery_city`.
- `delivery_state`.
- `delivery_postal_code`.
- `delivery_location`.
- `order_total_inr`.
- `currency`: default `INR`.
- `order_status`.
- `payment_status`.

Use additional fields when necessary:

- `subtotal_inr`.
- `discount_amount_inr`.
- `delivery_fee_inr`.
- `shipping_address_snapshot`.
- `customer_note`.
- `updated_at`.
- `cancelled_at`, where applicable.

Define allowed order statuses, such as:

- `pending`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

Define payment statuses, such as:

- `pending`
- `paid`
- `failed`
- `refunded`

Choose a consistent state-transition policy and validate status changes.

### Order requirements

1. Generate unique order IDs.
2. Link every order to a valid customer.
3. Record the order's date, weekday, time, delivery city, state, and PIN code.
4. Use timezone-aware timestamps and store timestamps consistently.
5. Derive the displayed weekday and local time from the canonical timestamp instead of trusting client-provided values.
6. Preserve historical shipping details where necessary.
7. Store a reliable breakdown of subtotal, discount, delivery fee, and final payable amount.
8. Prevent negative totals and invalid order states.
9. Handle cancellations and refunds without corrupting historical sales data.
10. Maintain consistent order totals when items or discounts change before checkout is finalized.

The client must never be trusted to determine the final price, discount, or payable amount.

---

## 6. Order Items Table

Create an `order_items` table based on `order_items.csv`.

Required fields:

- `order_item_id`: primary key.
- `order_id`: foreign key to orders.
- `product_id`: foreign key to products.
- `quantity`.
- `unit_price_inr`.
- `line_total_inr`.

Add historical snapshot fields where appropriate:

- `product_name_snapshot`.
- `flavor_snapshot`.
- `discount_amount_inr`, if discounts are applied at item level.

### Requirements

- Enforce positive item quantities.
- Calculate line totals from quantity and unit price.
- Validate calculations server-side.
- Use database transactions for order creation and stock reservation.
- Record the purchased unit price when the order is finalized.
- Do not change old order items when the Super Admin updates the current product price.
- Prevent invalid product or order references.

The initial seed data should contain 100 orders and approximately 150–250 order-item records, with at least one item for each seeded order.

A single order may contain multiple products or several cans of one flavor.

---

## 7. Inventory Table

Create an `inventory` table based on `inventory.csv`.

Required fields:

- `inventory_id`: primary key.
- `product_id`: foreign key to products.
- `stock_on_hand`.
- `reorder_level`.
- `location_name`.
- `last_updated_at`.

Add supporting tables or fields for inventory movements.

### Inventory functionality

The Super Admin must be able to:

- View current stock for all eight flavors.
- Adjust stock quantities.
- Record incoming stock and restocking.
- Review stock movement history.
- Configure reorder thresholds.
- Identify low-stock and out-of-stock products.
- View estimated days of stock remaining.
- Monitor inventory value when product costs are available.

### Critical stock rules

1. Stock quantities cannot become negative.
2. Prevent two concurrent orders from overselling the same product.
3. Reserve or decrement stock atomically during the order process.
4. Use database transactions and appropriate row locking or conditional updates.
5. Define how stock is released when an order is cancelled.
6. Avoid double-restocking or double-deducting stock during retries.
7. Maintain an inventory movement record for each adjustment.
8. Use the inventory table as the authoritative stock source.
9. Derive low-stock alerts from `stock_on_hand <= reorder_level`.

Create an inventory movement history table with the product, quantity change, movement type, related order if applicable, actor, timestamp, and reason.

---

## 8. Offers and Promotions Table

Create an `offers` table based on `offers.csv`.

Required fields:

- `offer_id`: primary key.
- `coupon_code`: unique.
- `offer_name`.
- `discount_percent`.
- `minimum_order_value_inr`.
- `valid_from`.
- `valid_until`.
- `is_active`.

Add optional fields for:

- Fixed-amount discounts.
- Maximum discount.
- Eligible products or flavors.
- Per-customer redemption limits.
- Total redemption limit.
- First-order-only eligibility.
- Promotion type.
- Free-delivery eligibility.
- Created and updated timestamps.

### Offer management

The Super Admin must be able to:

- Create offers.
- Edit coupon codes and offer descriptions.
- Change discount percentages and minimum order values.
- Set offer start and expiry dates.
- Activate or deactivate promotions.
- Configure free delivery.
- Define eligibility rules.
- View promotion usage and performance.

### Validation rules

- Coupon codes must be unique.
- Discount values must be valid.
- Expired or inactive offers cannot be redeemed.
- The server must calculate discount amounts.
- Validate minimum order values and eligibility.
- Prevent customers from applying the same promotion multiple times when prohibited.
- Track redemption records reliably.
- Avoid trusting discount values submitted by the browser.

### Vyra Pulse delivery rules

Support configurable delivery promotions:

- Free delivery on qualifying orders above ₹445.
- Free delivery for eligible first orders.

Store these thresholds and eligibility rules in database configuration or promotion records rather than hardcoding them across frontend components.

Define whether the ₹445 threshold is evaluated before or after discounts and apply the same policy consistently.

---

## 9. Supporting Database Tables

Create the following additional tables where required.

### A. `addresses`

Stores customer delivery addresses.

Fields may include:

- `address_id`.
- `customer_id`.
- `address_line_1`.
- `address_line_2`.
- `city`.
- `state`.
- `postal_code`.
- `is_default`.
- `created_at`.

Restrict customer access to their own addresses.

### B. `promotion_redemptions`

Tracks promotion usage.

Fields may include:

- `redemption_id`.
- `offer_id`.
- `customer_id`.
- `order_id`.
- `discount_amount_inr`.
- `redeemed_at`.

Enforce the applicable redemption limits and prevent duplicate redemptions.

### C. `inventory_movements`

Stores a history of inventory changes, including sales, restocking, returns, and manual adjustments.

### D. `audit_logs`

Records important administrative changes.

Include:

- `audit_id`.
- `actor_user_id`.
- `action`.
- `entity_type`.
- `entity_id`.
- `old_values`.
- `new_values`.
- `created_at`.

Use audit logs for price changes, offer changes, product availability changes, stock adjustments, and order-status changes.

Users must not be able to modify or delete audit records through normal application operations.

### E. `store_settings`

Stores configurable business settings, including:

- Store currency.
- Delivery fee.
- Free-delivery threshold.
- First-order delivery eligibility.
- Default reorder settings.
- Other operational configuration.

Restrict modifications to the Super Admin.

### F. `product_costs`

If necessary, store unit cost information for profitability analysis. Restrict access to sensitive cost information.

### G. `payment_records`

If payment integration is implemented, store provider references, payment status, transaction timestamps, and amounts. Never store raw payment card numbers or security codes.

---

## 10. Supabase Storage for Product Images

Use Supabase Storage for the eight Vyra Pulse flavor images.

Requirements:

1. Create an appropriate product-image bucket.
2. Upload each flavor's image.
3. Associate the image with the correct product record.
4. Store an image path or URL in the database.
5. Validate allowed file types and reasonable file-size limits.
6. Use optimized image formats where appropriate.
7. Configure read access for storefront product images.
8. Restrict upload, replacement, and deletion permissions to the Super Admin.
9. Ensure that replacing an image does not create broken product references.
10. Never assume that an image uploaded to the repository is automatically available in Supabase Storage.

Preserve the product images provided by the developer. Do not substitute unrelated stock images.

The 3D product models and textures may be served as optimized static assets or stored in an appropriate storage bucket. Keep large binary assets out of PostgreSQL table fields.

---

## 11. Initial Synthetic Data Seeding

Generate and import the six initial CSV datasets.

### Initial record counts

| Dataset | Initial records |
|---|---:|
| Products | 8 |
| Customers | 100 |
| Orders | 100 |
| Order items | Approximately 150–250 |
| Inventory | 8 |
| Offers | 5 |

Use the supplied CSV column definitions and retain the agreed field names where practical.

### Data quality requirements

- All customer IDs referenced by orders must exist.
- All product IDs referenced by order items and inventory must exist.
- All order IDs referenced by order items must exist.
- Every order must contain at least one order item.
- Order totals must match the relevant items, discounts, and delivery fees.
- Product stock and inventory seed values must be reconciled.
- Coupon codes must be unique.
- Timestamps must be valid.
- Synthetic data must be clearly documented as demo data.
- Avoid real personal information in generated customer records.
- Do not invent actual product formulations or verified caffeine specifications.

Use deterministic IDs and an idempotent seed process so that rerunning the seed script does not duplicate records.

Provide:

- SQL migrations.
- Seed scripts.
- CSV import instructions.
- Data validation checks.
- A README explaining setup and reset procedures.

Use a safe development reset procedure. Do not drop or overwrite production data during normal deployment.

---

## 12. Live Order Processing

Implement a complete database-backed checkout workflow.

When a customer places an order:

1. Authenticate the customer.
2. Fetch current product prices from the database.
3. Verify that every product is active and available.
4. Validate quantities and inventory.
5. Validate applicable coupon codes and promotional eligibility.
6. Calculate item totals, subtotal, discounts, delivery charges, and final amount on the server.
7. Create the order and order-item records.
8. Reserve or deduct inventory using transaction-safe database logic.
9. Record inventory movements.
10. Record promotion redemption when applicable.
11. Return the confirmed order to the customer.
12. Notify the admin dashboard through Supabase Realtime.
13. Update relevant customer and BI views.

Use a PostgreSQL function or a secure server-side transaction workflow for multi-step operations.

Do not implement checkout as a sequence of independent client-side inserts that can leave partial orders or inconsistent stock.

Make order creation idempotent so network retries cannot accidentally create duplicate orders.

If payment processing is integrated, define the payment confirmation and stock reservation strategy carefully. Do not mark an order as paid solely because the browser reports success.

---

## 13. Live Product and Offer Updates

When the Super Admin changes a product price:

- Save the change in PostgreSQL.
- Update the relevant `updated_at` field.
- Record the change in the audit log.
- Publish or subscribe to appropriate database changes.
- Refresh relevant product queries.
- Display the new price on the customer storefront.
- Use the updated price for future orders.
- Preserve historical order prices.

When the Super Admin creates, edits, or deactivates an offer:

- Save the changes to PostgreSQL.
- Validate date ranges and discount rules.
- Update active promotions shown to customers.
- Reject expired or deactivated coupon codes at checkout.
- Keep historical redemption records.
- Refresh offer analytics.

Do not use hardcoded prices or offers as the source of truth in React components.

---

## 14. Supabase Realtime Requirements

Configure Supabase Realtime for the appropriate database tables and events.

Use it for:

- New order notifications.
- Order-status changes.
- Product price and availability updates.
- Inventory changes.
- Offer activation or deactivation.

Requirements:

- Subscribe only to necessary events.
- Ensure that subscriptions are removed when components unmount.
- Restrict access to private customer and administrative data.
- Use RLS and authorization checks for subscription access.
- Handle reconnection and missed events.
- Refresh database queries when required to maintain consistency.
- Avoid duplicate notifications.
- Do not rely on Realtime messages as the permanent record of a transaction.

The PostgreSQL database remains authoritative even if a real-time event is missed.

---

## 15. Row Level Security and Permissions

Enable Row Level Security on all tables exposed through Supabase APIs.

Implement explicit policies.

### Customer permissions

Customers may:

- Read active products and eligible offers.
- Read their own profile.
- Manage their own permitted profile fields and addresses.
- Read their own orders and order items.
- Create orders through the secure checkout workflow.
- Read their own promotion-redemption history where appropriate.

Customers must not:

- Change product prices.
- Modify inventory directly.
- Change their role to admin.
- Read other customers' private information.
- Modify order totals after checkout.
- Mark payments as paid.
- Modify audit logs.
- Bypass promotion restrictions.

### Super Admin permissions

The Super Admin may:

- Manage products and prices.
- Manage offers and delivery settings.
- Manage inventory and restocking.
- View all orders and permitted customer records.
- Update valid order statuses.
- View business-wide analytics and reports.
- Review administrative audit logs.

Validate the Super Admin's actual role through trusted server-side logic and database permissions.

Never rely solely on frontend route protection.

---

## 16. Business Intelligence Queries

Implement database queries, views, or materialized views where appropriate to support the existing dashboard.

### Executive metrics

Calculate:

- Total net sales.
- Gross profit.
- Gross margin percentage.
- Number of orders.
- Completed orders.
- Average order value.
- Total units sold.
- Registered customers.
- New versus returning customers.
- Revenue growth against the previous period.
- Low-stock product count.

Define consistent rules for cancelled orders, refunds, discounts, and revenue recognition.

### Sales analytics

Provide:

- Daily, weekly, and monthly sales.
- Sales by flavor and product.
- Sales by city and state.
- Sales by order status.
- Sales by promotion.
- Average order value.
- Units sold by period.
- Revenue comparisons between periods.

### Customer analytics

Provide:

- New customer registrations.
- Repeat-purchase rate.
- Customer order frequency.
- Customer lifetime spending based on available history.
- Customer segmentation using documented rules.

### Inventory analytics

Provide:

- Stock on hand.
- Low-stock products.
- Out-of-stock products.
- Inventory value, when unit costs are available.
- Average daily sales.
- Estimated days of stock remaining.

### Promotion analytics

Provide:

- Coupon usage.
- Orders using each offer.
- Total discount granted.
- Revenue associated with promotions.
- Average order value for promoted orders.

Use parameterized queries and appropriate indexes. Ensure dashboard filters for dates, products, regions, and order statuses are supported efficiently.

---

## 17. Data Consistency and Financial Calculations

Use appropriate numeric types for monetary values, not floating-point types.

Store currency consistently in INR.

Define a documented calculation policy for:

- Subtotal.
- Item-level discounts, if applicable.
- Order-level discounts.
- Delivery fees.
- Free-delivery eligibility.
- Final payable amount.
- Refunds.
- Net sales.
- Cost of goods sold.
- Gross profit.
- Gross margin.

Avoid counting cancelled orders as completed sales.

Avoid treating pending payments as confirmed paid revenue.

Ensure refunded orders are handled consistently in reports.

Preserve the historical price, quantity, discount, and product description for each finalized order item.

Use database constraints, foreign keys, transactions, and indexes to enforce data integrity.

---

## 18. Database Performance

Create indexes for frequently queried fields, including:

- `orders.customer_id`.
- `orders.ordered_at`.
- `orders.order_status`.
- `orders.payment_status`.
- `order_items.order_id`.
- `order_items.product_id`.
- `products.is_active`.
- `offers.coupon_code`.
- `inventory.product_id`.
- `profiles.user_id`.
- Relevant foreign keys and commonly filtered columns.

Use pagination for large order and customer tables.

Avoid fetching entire tables into the browser for dashboard calculations.

Use server-side aggregation for analytics. Introduce materialized views only when justified, and define how they are refreshed.

---

## 19. Environment Configuration

Use environment variables for Supabase configuration.

Client-side configuration may include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or the appropriate publishable key for the project.

Server-side secrets must remain private.

Never commit service-role keys, database passwords, or other secrets to GitHub.

Provide an `.env.example` file containing placeholder values only.

Document how to configure development, staging, and production environments.

---

## 20. Testing and Acceptance Criteria

Implement tests for:

1. Database migrations.
2. Seed-data integrity.
3. Authentication and role permissions.
4. RLS isolation between customers.
5. Product creation and price changes.
6. Offer creation, expiry, and validation.
7. Order creation and total calculations.
8. Inventory deduction and cancellation handling.
9. Concurrent orders for limited stock.
10. Idempotent checkout retries.
11. Audit logging.
12. Realtime subscriptions.
13. BI calculations.
14. Historical order-price preservation.
15. Unauthorized attempts to modify administrative records.

The implementation is complete only when:

- All six CSV datasets can be imported correctly.
- The eight flavor products are present.
- The Super Admin can update prices, offers, and stock.
- Customers can place valid orders.
- Orders and inventory remain consistent.
- Historical transactions retain their original prices.
- Dashboard metrics are calculated from PostgreSQL.
- Changes appear in relevant connected views.
- RLS prevents unauthorized data access.
- Setup and deployment instructions are documented.

## Final Instructions

First inspect the existing codebase and identify the required database integration points.

Then implement the schema, migrations, seed scripts, authentication policies, transactional database operations, storage integration, real-time subscriptions, and BI queries.

Do not rebuild the UI, redesign the login pages, alter the existing 3D animations, or replace the current visual components.

Do not claim that functionality is complete unless the database operations, permissions, and relevant application flows have actually been implemented and tested.

**Final goal:** Build a secure, normalized, real-time Supabase database and backend for Vyra Pulse that supports the existing customer storefront, Super Admin dashboard, and Business Intelligence features.