"""
VYRA PULSE — SYNTHETIC DEMO SALES DATA GENERATOR (NON-DESTRUCTIVE SAFETY PATCH)
Generates exactly 200 synthetic demo orders and corresponding 241 order-item records
representing all 8 products, distributed across valid customer records, cities,
order statuses, payment statuses, and historical dates (July - September 2026).

Produces:
- supabase/synthetic_demo_orders.sql
    * Pre-execution collision check (aborts transaction if any ID exists)
    * ON CONFLICT (order_id) DO NOTHING
    * ON CONFLICT (order_item_id) DO NOTHING
- supabase/rollback_synthetic_demo_orders.sql
    * Exact ID targeting (no broad LIKE 'ORD-SYN-%' prefix deletes)
    * Strict deletion order: order_items first, then orders
"""

import csv
import json
import os
import random
from datetime import datetime, timedelta

# Set fixed seed for 100% deterministic, reproducible output
random.seed(42)

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATASETS_DIR = os.path.join(ROOT_DIR, 'Datasets')
if not os.path.exists(DATASETS_DIR):
    DATASETS_DIR = os.path.join(ROOT_DIR, 'Dataset')

OUTPUT_SQL_PATH = os.path.join(ROOT_DIR, 'supabase', 'synthetic_demo_orders.sql')
ROLLBACK_SQL_PATH = os.path.join(ROOT_DIR, 'supabase', 'rollback_synthetic_demo_orders.sql')

# 1. Load Products
with open(os.path.join(DATASETS_DIR, 'products.csv'), 'r', encoding='utf-8-sig') as f:
    products = list(csv.DictReader(f))

prod_by_id = {p['product_id']: p for p in products}
ALL_PRODUCT_IDS = [
    'VP-CIT-001', 'VP-BLU-002', 'VP-MAN-003', 'VP-WAT-004',
    'VP-GRA-005', 'VP-GUA-006', 'VP-MIN-007', 'VP-PEA-008'
]

# 2. Load Customers
with open(os.path.join(DATASETS_DIR, 'customers.csv'), 'r', encoding='utf-8-sig') as f:
    customers = list(csv.DictReader(f))

cust_by_id = {c['customer_id']: c for c in customers}

# 3. Load Existing Orders to identify historical customers
with open(os.path.join(DATASETS_DIR, 'orders.csv'), 'r', encoding='utf-8-sig') as f:
    existing_orders = list(csv.DictReader(f))

existing_cust_ids = set(o['customer_id'] for o in existing_orders)

zero_order_cust_ids = [c['customer_id'] for c in customers if c['customer_id'] not in existing_cust_ids]
active_cust_ids = [c['customer_id'] for c in customers if c['customer_id'] in existing_cust_ids]

order_customer_assignments = []

# Bucket 1: 50 customers x 1 order
for cid in zero_order_cust_ids[:50]:
    order_customer_assignments.append((cid, 'non_cancelled'))

# Bucket 2: 25 customers x 2 orders
for cid in zero_order_cust_ids[50:75]:
    order_customer_assignments.append((cid, 'non_cancelled'))
    order_customer_assignments.append((cid, 'non_cancelled'))

# Bucket 3: 15 customers x 3 orders
for cid in zero_order_cust_ids[75:90]:
    order_customer_assignments.append((cid, 'non_cancelled'))
    order_customer_assignments.append((cid, 'non_cancelled'))
    order_customer_assignments.append((cid, 'non_cancelled'))

# Bucket 4: 15 customers x 1 cancelled order
for cid in zero_order_cust_ids[90:105]:
    order_customer_assignments.append((cid, 'cancelled'))

# Bucket 5: 20 repeat customers x 2 orders (5 of which will be cancelled, 35 non-cancelled)
for i, cid in enumerate(active_cust_ids[:20]):
    order_customer_assignments.append((cid, 'cancelled' if i < 5 else 'non_cancelled'))
    order_customer_assignments.append((cid, 'non_cancelled'))

assert len(order_customer_assignments) == 200, f"Expected 200, got {len(order_customer_assignments)}"

# Shuffle assignment order deterministically
random.shuffle(order_customer_assignments)

# Available order statuses for non-cancelled orders:
non_cancelled_statuses = (
    ['delivered'] * 110 +
    ['shipped'] * 35 +
    ['processing'] * 23 +
    ['pending'] * 12
)
random.shuffle(non_cancelled_statuses)

# Generate timestamps between 2026-07-02 and 2026-09-06
start_time = datetime(2026, 7, 2, 8, 0, 0)
end_time = datetime(2026, 9, 6, 18, 0, 0)
total_seconds = int((end_time - start_time).total_seconds())

order_records = []
order_item_records = []

product_pool = [
    'VP-BLU-002', 'VP-BLU-002', 'VP-BLU-002',
    'VP-WAT-004', 'VP-WAT-004', 'VP-WAT-004',
    'VP-GRA-005', 'VP-GRA-005', 'VP-GRA-005',
    'VP-MIN-007', 'VP-MIN-007', 'VP-MIN-007',
    'VP-PEA-008', 'VP-PEA-008', 'VP-PEA-008',
    'VP-CIT-001', 'VP-CIT-001',
    'VP-MAN-003', 'VP-MAN-003',
    'VP-GUA-006', 'VP-GUA-006',
]

COUPONS = [
    ('WELCOME10', 0.10, 500.0),
    ('PULSE15', 0.15, 750.0),
    ('MANGO5', 0.05, 149.0),
    ('BERRY10', 0.10, 298.0),
]

current_item_index = 1001

for idx in range(200):
    order_num = 1001 + idx
    order_id = f"ORD-SYN-{order_num:05d}"
    
    cust_id, target_category = order_customer_assignments[idx]
    cust = cust_by_id[cust_id]
    
    if target_category == 'cancelled':
        order_status = 'cancelled'
        payment_status = random.choice(['refunded', 'refunded', 'refunded', 'failed'])
    else:
        order_status = non_cancelled_statuses.pop()
        if order_status in ('delivered', 'shipped'):
            payment_status = 'paid'
        elif order_status == 'processing':
            payment_status = random.choice(['paid', 'paid', 'paid', 'pending'])
        else:
            payment_status = random.choice(['pending', 'pending', 'paid'])
    
    offset_secs = int((idx / 200.0) * total_seconds) + random.randint(-18000, 18000)
    offset_secs = max(0, min(total_seconds, offset_secs))
    dt = start_time + timedelta(seconds=offset_secs)
    
    ordered_at_str = dt.strftime('%Y-%m-%dT%H:%M:%S+00:00')
    order_day = dt.strftime('%A')
    ist_dt = dt + timedelta(hours=5, minutes=30)
    order_time_local = ist_dt.strftime('%H:%M:%S')
    
    is_multi_item = (random.random() < 0.25)
    
    if is_multi_item:
        p1 = random.choice(product_pool)
        remaining_pool = [p for p in product_pool if p != p1]
        p2 = random.choice(remaining_pool)
        selected_prods = [p1, p2]
    else:
        selected_prods = [random.choice(product_pool)]
        
    order_subtotal = 0.0
    items_for_order = []
    
    for prod_id in selected_prods:
        p_info = prod_by_id[prod_id]
        unit_price = float(p_info['price_inr'])
        qty = random.choices([1, 2, 3, 4], weights=[40, 35, 15, 10])[0]
        line_total = round(qty * unit_price, 2)
        order_subtotal += line_total
        
        item_id = f"ITEM-SYN-{current_item_index:05d}"
        current_item_index += 1
        
        items_for_order.append({
            'order_item_id': item_id,
            'order_id': order_id,
            'product_id': prod_id,
            'quantity': qty,
            'unit_price_inr': unit_price,
            'line_total_inr': line_total,
            'product_name_snapshot': p_info['product_name'],
            'flavor_snapshot': p_info['flavor'],
            'created_at': ordered_at_str,
        })
    
    order_subtotal = round(order_subtotal, 2)
    
    discount_amount = 0.0
    applied_coupon = None
    if order_subtotal >= 298.0 and random.random() < 0.30:
        valid_coupons = [c for c in COUPONS if order_subtotal >= c[2]]
        if valid_coupons:
            c_code, c_pct, _ = random.choice(valid_coupons)
            applied_coupon = c_code
            discount_amount = round(order_subtotal * c_pct, 2)
            
    delivery_fee = 0.0
    order_total = round(order_subtotal - discount_amount + delivery_fee, 2)
    
    order_records.append({
        'order_id': order_id,
        'customer_id': cust_id,
        'ordered_at': ordered_at_str,
        'order_day': order_day,
        'order_time_local': order_time_local,
        'delivery_city': cust['city'],
        'delivery_state': cust['state'],
        'delivery_postal_code': cust['postal_code'],
        'delivery_location': f"{cust['city']}, {cust['state']}, India",
        'subtotal_inr': order_subtotal,
        'discount_amount_inr': discount_amount,
        'delivery_fee_inr': delivery_fee,
        'order_total_inr': order_total,
        'currency': 'INR',
        'order_status': order_status,
        'payment_status': payment_status,
        'created_at': ordered_at_str,
        'updated_at': ordered_at_str,
    })
    
    order_item_records.extend(items_for_order)

# Sort orders by ordered_at
order_records.sort(key=lambda x: x['ordered_at'])

order_id_list = [o['order_id'] for o in order_records]
item_id_list = [it['order_item_id'] for it in order_item_records]

def esc(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

# Build Pre-execution collision check SQL
order_ids_formatted = ",\n        ".join(f"'{oid}'" for oid in order_id_list)
item_ids_formatted = ",\n        ".join(f"'{iid}'" for iid in item_id_list)

sql_lines = [
    "-- ==============================================================================",
    "-- VYRA PULSE — SYNTHETIC DEMO SALES DATA (NON-DESTRUCTIVE SAFETY PATCH)",
    "-- Batch Size: 200 Orders (ORD-SYN-01001 to ORD-SYN-01200)",
    "--             241 Order Items (ITEM-SYN-01001 to ITEM-SYN-01241)",
    "-- Safety Controls:",
    "--   1. Atomic transaction (BEGIN ... COMMIT).",
    "--   2. Pre-execution collision checks abort transaction if ANY ID exists.",
    "--   3. Non-destructive ON CONFLICT (order_id) DO NOTHING.",
    "--   4. Non-destructive ON CONFLICT (order_item_id) DO NOTHING.",
    "--   5. Preserves all seed data and authentic customer checkout orders.",
    "-- Rollback: See supabase/rollback_synthetic_demo_orders.sql",
    "-- ==============================================================================\n",
    "BEGIN;\n",
    "-- 1. PRE-EXECUTION COLLISION CHECK",
    "-- Aborts transaction immediately if ANY of the 200 order IDs or 241 item IDs already exist.",
    "DO $$",
    "DECLARE",
    "    v_order_collisions INTEGER;",
    "    v_item_collisions INTEGER;",
    "BEGIN",
    "    SELECT COUNT(*) INTO v_order_collisions",
    "    FROM public.orders",
    "    WHERE order_id IN (",
    f"        {order_ids_formatted}",
    "    );",
    "",
    "    SELECT COUNT(*) INTO v_item_collisions",
    "    FROM public.order_items",
    "    WHERE order_item_id IN (",
    f"        {item_ids_formatted}",
    "    );",
    "",
    "    IF v_order_collisions > 0 OR v_item_collisions > 0 THEN",
    "        RAISE EXCEPTION 'SYNTHETIC_DATA_COLLISION_DETECTED: Found % colliding orders and % colliding items. Aborting transaction.',",
    "            v_order_collisions, v_item_collisions;",
    "    END IF;",
    "END $$;\n",
    "-- 2. INSERT SYNTHETIC ORDERS (200 records)",
    "INSERT INTO public.orders (",
    "    order_id, customer_id, ordered_at, order_day, order_time_local,",
    "    delivery_city, delivery_state, delivery_postal_code, delivery_location,",
    "    subtotal_inr, discount_amount_inr, delivery_fee_inr, order_total_inr,",
    "    currency, order_status, payment_status, created_at, updated_at",
    ") VALUES"
]

order_val_clauses = []
for o in order_records:
    clause = (
        f"    ({esc(o['order_id'])}, {esc(o['customer_id'])}, {esc(o['ordered_at'])}, {esc(o['order_day'])}, {esc(o['order_time_local'])}, "
        f"{esc(o['delivery_city'])}, {esc(o['delivery_state'])}, {esc(o['delivery_postal_code'])}, {esc(o['delivery_location'])}, "
        f"{o['subtotal_inr']:.2f}, {o['discount_amount_inr']:.2f}, {o['delivery_fee_inr']:.2f}, {o['order_total_inr']:.2f}, "
        f"{esc(o['currency'])}, {esc(o['order_status'])}, {esc(o['payment_status'])}, {esc(o['created_at'])}, {esc(o['updated_at'])})"
    )
    order_val_clauses.append(clause)

sql_lines.append(",\n".join(order_val_clauses))
sql_lines.append("ON CONFLICT (order_id) DO NOTHING;\n")

sql_lines.append(f"-- 3. INSERT SYNTHETIC ORDER ITEMS ({len(order_item_records)} records)")
sql_lines.append("INSERT INTO public.order_items (")
sql_lines.append("    order_item_id, order_id, product_id, quantity, unit_price_inr,")
sql_lines.append("    line_total_inr, product_name_snapshot, flavor_snapshot, created_at")
sql_lines.append(") VALUES")

item_val_clauses = []
for it in order_item_records:
    clause = (
        f"    ({esc(it['order_item_id'])}, {esc(it['order_id'])}, {esc(it['product_id'])}, {it['quantity']}, {it['unit_price_inr']:.2f}, "
        f"{it['line_total_inr']:.2f}, {esc(it['product_name_snapshot'])}, {esc(it['flavor_snapshot'])}, {esc(it['created_at'])})"
    )
    item_val_clauses.append(clause)

sql_lines.append(",\n".join(item_val_clauses))
sql_lines.append("ON CONFLICT (order_item_id) DO NOTHING;\n")

sql_lines.append("COMMIT;\n")

with open(OUTPUT_SQL_PATH, 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_lines))

print(f"Generated synthetic orders SQL: {OUTPUT_SQL_PATH}")

# 4. Write Rollback Script (Targeting EXACT IDs only, NO broad wildcard prefix matching)
rollback_lines = [
    "-- ==============================================================================",
    "-- VYRA PULSE — ROLLBACK SYNTHETIC DEMO SALES DATA (EXACT ID TARGETING)",
    "-- Purpose: Safely removes ONLY the exact 200 synthetic demo orders and 241 items.",
    "-- Safety Controls:",
    "--   1. Atomic transaction (BEGIN ... COMMIT).",
    "--   2. Deletes child records (public.order_items) first.",
    "--   3. Deletes parent records (public.orders) second.",
    "--   4. Targets EXACT IDs only (NO broad prefix wildcards).",
    "--   5. Preserves all seed records and live customer checkout orders.",
    "-- ==============================================================================\n",
    "BEGIN;\n",
    "-- Step 1: Delete child order items by exact ID list (241 items)",
    "DELETE FROM public.order_items",
    "WHERE order_item_id IN (",
    f"    {item_ids_formatted}",
    ");\n",
    "-- Step 2: Delete parent orders by exact ID list (200 orders)",
    "DELETE FROM public.orders",
    "WHERE order_id IN (",
    f"    {order_ids_formatted}",
    ");\n",
    "COMMIT;\n",
    "-- Verification query (both must return 0)",
    "SELECT COUNT(*) AS remaining_synthetic_items",
    "FROM public.order_items",
    "WHERE order_item_id IN (",
    f"    {item_ids_formatted}",
    ");\n",
    "SELECT COUNT(*) AS remaining_synthetic_orders",
    "FROM public.orders",
    "WHERE order_id IN (",
    f"    {order_ids_formatted}",
    ");"
]

with open(ROLLBACK_SQL_PATH, 'w', encoding='utf-8') as f:
    f.write("\n".join(rollback_lines))

print(f"Generated rollback SQL: {ROLLBACK_SQL_PATH}")
