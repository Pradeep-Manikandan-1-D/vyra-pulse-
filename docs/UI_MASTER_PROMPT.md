# Master Prompt: Vyra Pulse — 3D E-Commerce & Business Intelligence Platform

Act as a senior full-stack developer, UI/UX designer, 3D web developer, and Business Intelligence engineer. Build **Vyra Pulse**, a premium energy drink e-commerce platform with a powerful Super Admin dashboard, customer shopping portal, and integrated business intelligence.

The application must be visually impressive, fully responsive, functional, secure, and ready for cloud deployment. Prioritize a premium user experience without compromising performance, accessibility, or data security.

## 1. Technology Stack

- **Frontend:** React
- **Programming language:** TypeScript
- **Styling:** Tailwind CSS
- **UI component library:** shadcn/ui
- **3D product visuals:** Three.js, React Three Fiber, and Drei
- **Animations:** Motion for React
- **Charts:** Recharts
- **Backend and database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **Database security:** Supabase Row Level Security (RLS)
- **Real-time updates:** Supabase Realtime
- **Deployment:** Vercel
- **Version control:** Git and GitHub

Use a compatible React application framework and maintain a clean, modular project structure. Prefer Next.js with the App Router if starting from scratch, as it supports server-side rendering and server-side authorization.

## 2. Brand Identity and Visual Design

Create a distinctive, premium, futuristic identity for **VYRA PULSE**, an energy drink brand.

**Design direction:**
- Primary background: black and charcoal.
- Accent: neon lime green.
- Typography: bold, modern, high-contrast white typography.
- Components: dark glassmorphism, subtle borders, soft glows, refined shadows, and generous spacing.
- Product visuals: realistic aluminum energy-drink cans, condensation, dramatic studio lighting, and floating particles.
- Overall feeling: premium energy, performance, technology, and innovation.

Use a consistent design system across the login pages, customer storefront, and admin dashboard. The customer and admin experiences must have distinct visual identities while remaining recognizably part of the same brand.

Avoid excessive neon effects, cluttered layouts, unnecessary animations, and generic dashboard templates.

## 3. Landing Page and Portal Selection

Create an immersive entry page that introduces the Vyra Pulse brand.

Include:
- Animated Vyra Pulse logo.
- A cinematic hero section featuring a 3D energy-drink can.
- A subtle animated background with particles and lighting effects.
- Two clear navigation options: **Admin Portal** and **Customer Store**.
- Smooth transitions between the landing page and each portal.
- Responsive layouts for desktop, tablet, and mobile.

The admin and customer portals must lead to separate login experiences.

## 4. Separate 3D Login Experiences

### A. Admin Login Page

Create a sophisticated, professional login interface designed for the Super Admin.

**Visual requirements:**
- A floating or slowly rotating 3D Vyra Pulse energy-drink can.
- Dark, cinematic background with subtle neon-lime lighting.
- Animated particles, restrained glow effects, and smooth camera movement.
- A clean login card with email and password fields.
- Password visibility toggle.
- Show/hide password functionality.
- Loading states, validation messages, and authentication error handling.
- Password recovery functionality.
- Accessible form controls and keyboard navigation.

The visual atmosphere should communicate authority, security, and business control.

After successful authentication, redirect the Super Admin to the admin dashboard.

### B. Customer Login and Registration Page

Create a visually engaging, product-focused customer authentication experience.

**Visual requirements:**
- A different 3D composition featuring multiple Vyra Pulse cans or flavor variants.
- Smooth floating, rotation, and parallax effects.
- Product cards or flavor visuals integrated into the page.
- A modern login and registration interface.
- Email and password fields.
- Password visibility toggle and password recovery.
- Clear validation and authentication feedback.
- A smooth transition into the customer storefront after successful login.

Include a clear option for customers to return to the main store or browse products as guests if guest browsing is enabled.

### 3D implementation requirements

- Use React Three Fiber and Drei for the 3D scene.
- Prefer optimized GLB/GLTF product models with suitable textures and lighting.
- If a custom model is unavailable, create a convincing can using procedural geometry and branded materials.
- Use Motion for React for page transitions and conventional UI animations.
- Dynamically load 3D scenes where appropriate.
- Provide static image fallbacks and reduced-motion support.
- Optimize texture sizes, model complexity, and rendering performance.
- Avoid blocking login forms while 3D assets load.
- Ensure authentication and core functionality work even when WebGL is unavailable.

## 5. Authentication and Access Control

Implement two user types:

1. **Super Admin**
2. **Customer**

Use Supabase Auth for account authentication.

The Super Admin must have exclusive access to administrative operations, including:
- Changing product prices.
- Adding, editing, and deactivating products.
- Updating offers, discounts, and promotional banners.
- Managing inventory and product availability.
- Viewing all orders and updating their statuses.
- Viewing customer and business analytics.
- Configuring delivery promotions and minimum-order thresholds.
- Viewing reports and audit logs.

Customers must only be able to manage their own accounts, carts, orders, addresses, and permitted loyalty features.

Security requirements:
- Protect admin routes and server-side operations.
- Assign the Super Admin role through a secure server-side process.
- Never allow users to grant themselves administrative privileges.
- Enforce authorization using server-side checks and Supabase RLS.
- Never expose the Supabase service-role key in client-side code.
- Keep customer records and order information isolated between users.
- Validate all price, discount, and order calculations on the server.
- Record important administrative changes in an audit log.

Do not rely on hiding admin URLs or displaying different pages as the only security mechanism.

## 6. Super Admin Dashboard

Create a premium admin command center with a responsive sidebar, top navigation, search, notifications, profile controls, and clear page hierarchy.

### A. Executive Overview

Display database-driven KPIs:
- Total revenue.
- Gross profit and gross margin, where product costs are available.
- Total orders and completed orders.
- Total registered customers.
- Average order value.
- Units sold.
- Revenue growth compared with a previous period.
- Low-stock product count.

Include date filters, KPI comparisons, revenue trends, top-selling products, recent orders, and actionable alerts.

### B. Product Management

Allow the Super Admin to:
- Add new energy drink products.
- Edit product names and descriptions.
- Update prices and compare-at prices.
- Upload and replace product images.
- Manage flavors, variants, pack sizes, and categories.
- Update product availability and visibility.
- Set product costs for profitability analysis.
- View product sales and stock levels.

Validate prices and product details before saving. Changes must persist in PostgreSQL and appear in the customer storefront.

### C. Offers and Promotions

Create a dedicated promotion management module.

The Super Admin must be able to:
- Create and edit discount codes.
- Configure percentage-based and fixed-amount discounts.
- Set start and expiry dates.
- Define minimum order values.
- Limit promotional usage where required.
- Activate, deactivate, and expire offers.
- Configure free-delivery promotions.
- Manage promotional banners and featured offers.

Support the planned Vyra Pulse promotion rules, including free delivery for qualifying orders above ₹445 and for eligible first orders. Make thresholds configurable rather than hardcoding them throughout the application.

Ensure discount validation and final payable amounts are calculated securely on the server.

### D. Order Management

Display orders with:
- Order ID and date.
- Customer information appropriate for administration.
- Purchased products and quantities.
- Subtotal, discounts, delivery charges, and final amount.
- Payment status.
- Fulfilment and delivery status.

Provide search, filters, sorting, and order-detail views.

Allow the Super Admin to update valid order statuses, with important changes recorded in the audit log. Prevent invalid transitions and clearly handle cancellations and refunds.

### E. Inventory Management

Include:
- Current stock by product and variant.
- Low-stock alerts.
- Configurable reorder thresholds.
- Stock movement history.
- Stock adjustments and restocking records.
- Inventory valuation based on recorded costs.
- Demand and stock-depletion estimates based on historical sales.

Maintain consistent inventory updates when orders are placed, cancelled, or fulfilled.

### F. Customer Management

Provide a searchable customer directory with:
- Customer profile and registration date.
- Order count and purchase history.
- Total spending and average order value.
- New versus returning customer status.
- Repeat-purchase and retention analytics.

Restrict access to information that is necessary for business operations.

### G. Business Intelligence and Analytics

Use Recharts to create interactive visualizations for:
- Daily, weekly, and monthly revenue.
- Product and flavor performance.
- Sales by region and channel, when location and channel data exist.
- Customer acquisition and retention.
- Order-status distribution.
- Gross margin and product profitability.
- Promotion performance.
- Inventory and demand trends.

Add interactive filters, comparisons, and drill-downs. All charts must be connected to database-backed data rather than decorative placeholder values.

### H. Business Insights

Generate clear, explainable insights from calculated metrics, such as:
- Products contributing the most revenue.
- Changes in revenue compared with previous periods.
- Flavors with increasing or decreasing demand.
- Products approaching their reorder thresholds.
- Customer segments with strong repeat-purchase behavior.

Start with deterministic, rule-based insights. Clearly distinguish actual results from estimates and forecasts.

### I. Reports and Settings

Include:
- CSV exports for permitted reports.
- Product and inventory summaries.
- Sales and order reports.
- Promotion performance reports.
- Business profile and store settings.
- Configurable delivery and promotion thresholds.
- Administrative audit history.

## 7. Customer E-Commerce Store

Build a premium storefront that complements the 3D login experience.

Include:
- Homepage with an animated 3D hero section.
- Product catalogue and product detail pages.
- Flavor and pack-size selection.
- Search, filtering, and sorting.
- Shopping cart and checkout.
- Delivery information and applicable offers.
- Order confirmation and order tracking.
- Customer account and order history.
- Responsive mobile navigation.
- Product recommendations based on actual catalogue information.

Use realistic product photography or 3D renders. Make all prices, offers, and product details come from the database.

Ensure the customer sees updated product prices, availability, and active offers after the Super Admin changes them.

## 8. Database Design

Design a normalized PostgreSQL schema that supports the platform.

Include appropriate tables for:
- User profiles and roles.
- Products and product variants.
- Product images and categories.
- Inventory and stock movements.
- Orders and order items.
- Payment records or payment status.
- Customer addresses.
- Promotions and discount rules.
- Cart items.
- Audit logs.

Use foreign keys, appropriate indexes, constraints, and transaction-safe operations where required.

Store historical order-item prices and discounts so that changing a product's current price does not alter past orders.

Keep order totals, inventory movements, and promotion applications consistent. Do not store sensitive payment card details in the application database.

## 9. Business Intelligence Data

Use a clearly documented synthetic dataset for demonstration and testing.

Generate realistic historical data for:
- Energy drink products and variants.
- Customers.
- Orders and order items.
- Product costs and stock movements.
- Discounts and promotions.
- Order dates, statuses, and delivery regions.

Use reproducible seed scripts and maintain referential integrity.

Clearly label synthetic data in the demonstration. Use actual database queries for KPIs and charts, and avoid fabricated live metrics.

## 10. Architecture and Code Quality

Organize the code into reusable modules, including:
- Authentication and authorization.
- Customer storefront.
- Admin dashboard.
- Product and promotion management.
- Order and inventory services.
- Analytics and reporting.
- Shared UI components.
- Database access and validation.
- 3D scenes and animation components.

Use TypeScript types, reusable components, form validation, loading states, error boundaries, empty states, and clear error messages.

Avoid giant components, duplicated business logic, hardcoded dashboard figures, and unnecessary dependencies.

## 11. Performance, Accessibility, and Security

- Ensure responsive behavior on mobile, tablet, and desktop.
- Lazy-load 3D scenes and heavy visualization components.
- Respect reduced-motion preferences.
- Provide accessible form labels, focus states, and keyboard interactions.
- Optimize images, GLB/GLTF models, and textures.
- Handle failed database requests and network errors gracefully.
- Enforce role permissions at the database and server levels.
- Never expose credentials, secrets, or unrestricted database access.
- Test customer isolation and unauthorized admin access.
- Use environment variables for deployment configuration.

## 12. Deployment and Acceptance Criteria

Deploy the application using Vercel and Supabase.

The finished application must satisfy these requirements:

1. Admin and customer login pages have distinct, polished 3D visual experiences.
2. Authentication works correctly for both user types.
3. The Super Admin can update product prices and details.
4. The Super Admin can create, edit, activate, and deactivate promotions.
5. Product and offer changes persist in the database and are reflected in the customer store.
6. Customers can browse products, manage their cart, and place orders through the implemented checkout flow.
7. Orders, inventory, and relevant BI metrics remain consistent.
8. Analytics respond correctly to filters and use database-backed data.
9. Unauthorized users cannot access administrative operations.
10. The application works on mobile and desktop, with fallbacks for unsupported 3D rendering.
11. The project includes setup instructions, environment-variable documentation, database migrations, and seed scripts.
12. The deployed version is functional, not merely a static UI prototype.

## Implementation Instructions

Build the project incrementally, in this order:

1. Establish the project structure, design system, and responsive layouts.
2. Build the landing page and separate 3D login experiences.
3. Configure Supabase authentication, roles, schema, and security.
4. Implement product, promotion, order, and inventory management.
5. Build the customer storefront and checkout flow.
6. Integrate BI calculations, interactive charts, and business insights.
7. Add real-time updates, reporting, and audit history.
8. Optimize 3D performance, test security and business logic, and deploy.

Before implementing, inspect the existing repository and preserve working code wherever possible. Do not recreate the project unnecessarily or overwrite existing functionality without checking it.

**Final objective:** Deliver a premium, animated, 3D-enhanced energy drink e-commerce platform with a secure Super Admin command center and meaningful Business Intelligence. Every important interaction should work, data must remain consistent, and the visual experience must support the business rather than distract from it.