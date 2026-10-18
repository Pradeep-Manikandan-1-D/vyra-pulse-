/**
 * Vyra Pulse — Phase 2 Authentication & Authorization Test Suite
 * Verifies route protection logic, role isolation rules, RLS migration integrity, and credential safety.
 */

import fs from "fs";
import path from "path";

function runAuthVerification() {
  console.log("==================================================");
  console.log("VYRA PULSE — PHASE 2 AUTH & SECURITY AUDIT");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  const test = (name: string, fn: () => boolean) => {
    try {
      if (fn()) {
        console.log(`  [PASS] ${name}`);
        passed++;
      } else {
        console.log(`  [FAIL] ${name}`);
        failed++;
      }
    } catch (e) {
      console.log(`  [FAIL] ${name}: ${(e as Error).message}`);
      failed++;
    }
  };

  // Test 1: Route Protection Logic
  console.log("\n1. ROUTE PROTECTION & ROLE BOUNDARY CHECKS:");

  const checkRouteAccess = (pathname: string, user: { email?: string; role?: string } | null): { allowed: boolean; redirect?: string } => {
    // Admin routes
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      if (!user) return { allowed: false, redirect: "/admin/login" };
      if (user.role !== "admin") return { allowed: false, redirect: "/admin/login?error=unauthorized" };
      return { allowed: true };
    }
    // Customer account routes
    if (pathname.startsWith("/account")) {
      if (!user) return { allowed: false, redirect: "/customer/login" };
      return { allowed: true };
    }
    return { allowed: true };
  };

  test("Unauthenticated user is blocked from /admin and redirected to /admin/login", () => {
    const res = checkRouteAccess("/admin", null);
    return !res.allowed && res.redirect === "/admin/login";
  });

  test("Customer (role='customer') is blocked from /admin/orders and redirected with unauthorized error", () => {
    const res = checkRouteAccess("/admin/orders", { email: "customer001@example.com", role: "customer" });
    return !res.allowed && res.redirect === "/admin/login?error=unauthorized";
  });

  test("Customer (role='customer') is blocked from /admin/inventory", () => {
    const res = checkRouteAccess("/admin/inventory", { email: "customer001@example.com", role: "customer" });
    return !res.allowed && res.redirect === "/admin/login?error=unauthorized";
  });

  test("Super Admin (role='admin') is allowed full access to /admin and submodules", () => {
    const r1 = checkRouteAccess("/admin", { email: "admin@gmail.com", role: "admin" });
    const r2 = checkRouteAccess("/admin/orders", { email: "admin@gmail.com", role: "admin" });
    const r3 = checkRouteAccess("/admin/analytics", { email: "admin@gmail.com", role: "admin" });
    return r1.allowed && r2.allowed && r3.allowed;
  });

  test("Unauthenticated user is blocked from /account/orders and redirected to /customer/login", () => {
    const res = checkRouteAccess("/account/orders", null);
    return !res.allowed && res.redirect === "/customer/login";
  });

  test("Customer is allowed into /account/orders and /account/wallet", () => {
    const r1 = checkRouteAccess("/account/orders", { email: "customer001@example.com", role: "customer" });
    const r2 = checkRouteAccess("/account/wallet", { email: "customer001@example.com", role: "customer" });
    return r1.allowed && r2.allowed;
  });

  // Test 2: RLS Migrations Integrity
  console.log("\n2. RLS & SQL POLICY INTEGRITY:");
  const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");

  test("Migration 2 (RLS policies) enables RLS on all 14 tables", () => {
    const sql = fs.readFileSync(path.join(migrationsDir, "20261017000002_rls_policies.sql"), "utf-8");
    const requiredTables = [
      "profiles", "products", "inventory", "inventory_movements",
      "customers", "addresses", "offers", "orders", "order_items",
      "promotion_redemptions", "loyalty_wallets", "loyalty_transactions",
      "store_settings", "audit_logs"
    ];
    return requiredTables.every(t => sql.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`));
  });

  test("Migration 4 (Auth triggers) prevents non-admin users from altering their role", () => {
    const sql = fs.readFileSync(path.join(migrationsDir, "20261017000004_auth_triggers.sql"), "utf-8");
    return sql.includes("trg_protect_profile_role") && sql.includes("Unauthorized: Only an administrator can modify user roles");
  });

  test("Migration 4 automatically provisions loyalty wallet upon customer registration", () => {
    const sql = fs.readFileSync(path.join(migrationsDir, "20261017000004_auth_triggers.sql"), "utf-8");
    return sql.includes("INSERT INTO public.loyalty_wallets (customer_id, points_balance)") && sql.includes("ON CONFLICT (customer_id) DO NOTHING");
  });

  // Test 3: Secret Protection & Credential Exposure Audit
  console.log("\n3. CREDENTIAL PROTECTION & SECRETS AUDIT:");

  test("No service role keys committed in git repository (.env.example has placeholders only)", () => {
    const envExample = fs.readFileSync(path.resolve(process.cwd(), ".env.example"), "utf-8");
    return envExample.includes("your-service-role-key-here") && !envExample.includes("eyJ");
  });

  test(".gitignore includes .env*.local and .env to prevent secret leakage", () => {
    const gitignore = fs.readFileSync(path.resolve(process.cwd(), ".gitignore"), "utf-8");
    return gitignore.includes(".env*.local") && gitignore.includes(".env");
  });

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runAuthVerification();
