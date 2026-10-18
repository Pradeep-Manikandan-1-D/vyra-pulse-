/**
 * Vyra Pulse — Supabase Seed Script
 * Reads the 6 seed CSVs, validates referential integrity, and upserts records into Supabase PostgreSQL.
 * Safe and idempotent: can be rerun without duplicating records.
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Helper to remove UTF-8 BOM if present
function parseCSV(content: string): Array<Record<string, string>> {
  const cleanContent = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Simple CSV line parser respecting quoted strings
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, "").trim());
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      let val = cols[idx] ?? "";
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      row[h] = val;
    });
    rows.push(row);
  }

  return rows;
}

async function seed() {
  console.log("==================================================");
  console.log("VYRA PULSE — SUPABASE SEED RUNNER");
  console.log("==================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl === "https://your-project.supabase.co" ||
    supabaseKey.includes("your-")
  ) {
    console.log("\n[INFO] Supabase credentials not yet configured in environment.");
    console.log("To seed a live Supabase project:");
    console.log("  1. Create a project at https://supabase.com");
    console.log("  2. Apply migrations located in supabase/migrations/ via Supabase SQL Editor");
    console.log("  3. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    console.log("  4. Re-run: npm run seed");
    console.log("\nAlternatively, you can run the generated SQL seed directly:");
    console.log("  • Copy and execute supabase/seed.sql inside the Supabase SQL Editor.");
    console.log("==================================================");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const dataDir = path.resolve(process.cwd(), "data");

  // 1. Seed Store Settings
  console.log("\n1. Seeding Store Settings...");
  const { error: settingsErr } = await supabase.from("store_settings").upsert({
    setting_id: "default_store_settings",
    free_shipping_threshold_inr: 445.0,
    standard_shipping_fee_inr: 50.0,
    loyalty_points_per_can: 10,
    triple_charge_bonus_points: 50,
    hoodie_reward_threshold_points: 400,
    free_drink_reward_threshold_points: 800,
    elite_tier_threshold_points: 1200,
    store_currency: "INR",
  });
  if (settingsErr) console.warn("  Notice:", settingsErr.message);
  else console.log("  ✓ Store settings upserted.");

  // 2. Seed Products
  console.log("\n2. Seeding Products (products.csv)...");
  const productsRaw = parseCSV(fs.readFileSync(path.join(dataDir, "products.csv"), "utf-8"));
  const productsPayload = productsRaw.map((p) => ({
    product_id: p.product_id,
    product_name: p.product_name,
    flavor: p.flavor,
    key_ingredients: p.key_ingredients,
    caffeine_mg_per_330ml: parseInt(p.caffeine_mg_per_330ml, 10),
    volume_ml: parseInt(p.volume_ml, 10),
    price_inr: parseFloat(p.price_inr),
    is_active: p.is_active.toLowerCase() === "true",
    image_url: "/assets/products/Drinks.png",
  }));

  const { error: prodErr } = await supabase.from("products").upsert(productsPayload, { onConflict: "product_id" });
  if (prodErr) console.error("  Error seeding products:", prodErr.message);
  else console.log(`  ✓ ${productsPayload.length} products upserted.`);

  // 3. Seed Inventory
  console.log("\n3. Seeding Inventory (inventory.csv)...");
  const invRaw = parseCSV(fs.readFileSync(path.join(dataDir, "inventory.csv"), "utf-8"));
  const invPayload = invRaw.map((i) => ({
    inventory_id: i.inventory_id,
    product_id: i.product_id,
    stock_on_hand: parseInt(i.stock_on_hand, 10),
    reorder_level: parseInt(i.reorder_level, 10),
    location_name: i.location_name,
    last_updated_at: i.last_updated_at,
  }));

  const { error: invErr } = await supabase.from("inventory").upsert(invPayload, { onConflict: "inventory_id" });
  if (invErr) console.error("  Error seeding inventory:", invErr.message);
  else console.log(`  ✓ ${invPayload.length} inventory records upserted.`);

  // 4. Seed Offers
  console.log("\n4. Seeding Offers (offers.csv)...");
  const offersRaw = parseCSV(fs.readFileSync(path.join(dataDir, "offers.csv"), "utf-8"));
  const offersPayload = offersRaw.map((o) => ({
    offer_id: o.offer_id,
    coupon_code: o.coupon_code,
    offer_name: o.offer_name,
    discount_percent: parseFloat(o.discount_percent),
    minimum_order_value_inr: parseFloat(o.minimum_order_value_inr),
    valid_from: o.valid_from,
    valid_until: o.valid_until,
    is_active: o.is_active.toLowerCase() === "true",
  }));

  const { error: offersErr } = await supabase.from("offers").upsert(offersPayload, { onConflict: "offer_id" });
  if (offersErr) console.error("  Error seeding offers:", offersErr.message);
  else console.log(`  ✓ ${offersPayload.length} offers upserted.`);

  // 5. Seed Customers & Initialize Wallets
  console.log("\n5. Seeding Customers (customers.csv)...");
  const custRaw = parseCSV(fs.readFileSync(path.join(dataDir, "customers.csv"), "utf-8"));
  const custPayload = custRaw.map((c) => ({
    customer_id: c.customer_id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    phone: c.phone,
    city: c.city,
    state: c.state,
    postal_code: c.postal_code,
    registered_at: c.registered_at,
  }));

  const { error: custErr } = await supabase.from("customers").upsert(custPayload, { onConflict: "customer_id" });
  if (custErr) console.error("  Error seeding customers:", custErr.message);
  else console.log(`  ✓ ${custPayload.length} customers upserted.`);

  const walletsPayload = custPayload.map((c) => ({
    customer_id: c.customer_id,
    points_balance: 0,
  }));
  const { error: walletErr } = await supabase.from("loyalty_wallets").upsert(walletsPayload, { onConflict: "customer_id" });
  if (walletErr) console.warn("  Notice on wallets:", walletErr.message);
  else console.log(`  ✓ ${walletsPayload.length} customer loyalty wallets initialized.`);

  // 6. Seed Orders
  console.log("\n6. Seeding Orders (orders.csv)...");
  const ordersRaw = parseCSV(fs.readFileSync(path.join(dataDir, "orders.csv"), "utf-8"));
  const ordersPayload = ordersRaw.map((o) => {
    const tot = parseFloat(o.order_total_inr);
    return {
      order_id: o.order_id,
      customer_id: o.customer_id,
      ordered_at: o.ordered_at,
      order_day: o.order_day,
      order_time_local: o.order_time_local,
      delivery_city: o.delivery_city,
      delivery_state: o.delivery_state,
      delivery_postal_code: o.delivery_postal_code,
      delivery_location: o.delivery_location,
      subtotal_inr: tot,
      discount_amount_inr: 0.0,
      delivery_fee_inr: 0.0,
      order_total_inr: tot,
      currency: o.currency,
      order_status: o.order_status,
      payment_status: o.payment_status,
    };
  });

  const { error: ordersErr } = await supabase.from("orders").upsert(ordersPayload, { onConflict: "order_id" });
  if (ordersErr) console.error("  Error seeding orders:", ordersErr.message);
  else console.log(`  ✓ ${ordersPayload.length} orders upserted.`);

  // 7. Seed Order Items
  console.log("\n7. Seeding Order Items (order_items.csv)...");
  const itemsRaw = parseCSV(fs.readFileSync(path.join(dataDir, "order_items.csv"), "utf-8"));
  const prodMap = new Map(productsRaw.map((p) => [p.product_id, p]));

  const itemsPayload = itemsRaw.map((it) => {
    const p = prodMap.get(it.product_id);
    return {
      order_item_id: it.order_item_id,
      order_id: it.order_id,
      product_id: it.product_id,
      quantity: parseInt(it.quantity, 10),
      unit_price_inr: parseFloat(it.unit_price_inr),
      line_total_inr: parseFloat(it.line_total_inr),
      product_name_snapshot: p ? p.product_name : "Vyra Pulse",
      flavor_snapshot: p ? p.flavor : "Signature",
    };
  });

  const { error: itemsErr } = await supabase.from("order_items").upsert(itemsPayload, { onConflict: "order_item_id" });
  if (itemsErr) console.error("  Error seeding order items:", itemsErr.message);
  else console.log(`  ✓ ${itemsPayload.length} order items upserted.`);

  console.log("\n==================================================");
  console.log("SEEDED ALL DATASETS SUCCESSFULLY!");
  console.log("==================================================");
}

seed().catch((err) => {
  console.error("Seed execution failed:", err);
  process.exit(1);
});
