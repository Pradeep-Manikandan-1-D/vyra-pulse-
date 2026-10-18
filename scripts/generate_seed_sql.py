"""
Generates the canonical supabase/seed.sql file from the six raw CSV datasets.
Handles UTF-8 BOM encoding and formats SQL inserts with ON CONFLICT DO UPDATE/NOTHING for idempotence.
"""

import csv
import os

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))
output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'supabase', 'seed.sql'))

def escape_sql(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

lines = [
    "-- ==============================================================================",
    "-- VYRA PULSE — IDEMPOTENT DATABASE SEED DATA",
    "-- Target Tables: store_settings, products, inventory, offers, customers, wallets, orders, order_items",
    "-- ==============================================================================\n",
    "-- 1. STORE SETTINGS",
    "INSERT INTO public.store_settings (",
    "    setting_id, free_shipping_threshold_inr, standard_shipping_fee_inr,",
    "    loyalty_points_per_can, triple_charge_bonus_points,",
    "    hoodie_reward_threshold_points, free_drink_reward_threshold_points,",
    "    elite_tier_threshold_points, store_currency",
    ") VALUES (",
    "    'default_store_settings', 445.0, 50.0, 10, 50, 400, 800, 1200, 'INR'",
    ") ON CONFLICT (setting_id) DO UPDATE SET",
    "    free_shipping_threshold_inr = EXCLUDED.free_shipping_threshold_inr,",
    "    standard_shipping_fee_inr = EXCLUDED.standard_shipping_fee_inr;\n"
]

# 2. PRODUCTS
lines.append("-- 2. PRODUCTS (8 Flavors)")
with open(os.path.join(base_dir, 'products.csv'), 'r', encoding='utf-8-sig') as f:
    products = list(csv.DictReader(f))

for p in products:
    lines.append(
        f"INSERT INTO public.products (product_id, product_name, flavor, key_ingredients, caffeine_mg_per_330ml, volume_ml, price_inr, is_active, image_url) "
        f"VALUES ({escape_sql(p['product_id'])}, {escape_sql(p['product_name'])}, {escape_sql(p['flavor'])}, {escape_sql(p['key_ingredients'])}, "
        f"{p['caffeine_mg_per_330ml']}, {p['volume_ml']}, {p['price_inr']}, {p['is_active'].lower()}, '/assets/products/Drinks.png') "
        f"ON CONFLICT (product_id) DO UPDATE SET "
        f"product_name = EXCLUDED.product_name, flavor = EXCLUDED.flavor, price_inr = EXCLUDED.price_inr;"
    )
lines.append("")

# 3. INVENTORY
lines.append("-- 3. INVENTORY (Authoritative Stock)")
with open(os.path.join(base_dir, 'inventory.csv'), 'r', encoding='utf-8-sig') as f:
    inventory = list(csv.DictReader(f))

for i in inventory:
    lines.append(
        f"INSERT INTO public.inventory (inventory_id, product_id, stock_on_hand, reorder_level, location_name, last_updated_at) "
        f"VALUES ({escape_sql(i['inventory_id'])}, {escape_sql(i['product_id'])}, {i['stock_on_hand']}, {i['reorder_level']}, {escape_sql(i['location_name'])}, {escape_sql(i['last_updated_at'])}) "
        f"ON CONFLICT (inventory_id) DO UPDATE SET "
        f"stock_on_hand = EXCLUDED.stock_on_hand, reorder_level = EXCLUDED.reorder_level;"
    )
lines.append("")

# 4. OFFERS
lines.append("-- 4. OFFERS (5 Initial Promotions)")
with open(os.path.join(base_dir, 'offers.csv'), 'r', encoding='utf-8-sig') as f:
    offers = list(csv.DictReader(f))

for o in offers:
    lines.append(
        f"INSERT INTO public.offers (offer_id, coupon_code, offer_name, discount_percent, minimum_order_value_inr, valid_from, valid_until, is_active) "
        f"VALUES ({escape_sql(o['offer_id'])}, {escape_sql(o['coupon_code'])}, {escape_sql(o['offer_name'])}, {o['discount_percent']}, {o['minimum_order_value_inr']}, {escape_sql(o['valid_from'])}, {escape_sql(o['valid_until'])}, {o['is_active'].lower()}) "
        f"ON CONFLICT (offer_id) DO UPDATE SET "
        f"offer_name = EXCLUDED.offer_name, discount_percent = EXCLUDED.discount_percent, minimum_order_value_inr = EXCLUDED.minimum_order_value_inr;"
    )
lines.append("")

# 5. CUSTOMERS & LOYALTY WALLETS
lines.append("-- 5. CUSTOMERS & LOYALTY WALLETS (100 Seed Customers)")
with open(os.path.join(base_dir, 'customers.csv'), 'r', encoding='utf-8-sig') as f:
    customers = list(csv.DictReader(f))

for c in customers:
    lines.append(
        f"INSERT INTO public.customers (customer_id, first_name, last_name, email, phone, city, state, postal_code, registered_at) "
        f"VALUES ({escape_sql(c['customer_id'])}, {escape_sql(c['first_name'])}, {escape_sql(c['last_name'])}, {escape_sql(c['email'])}, {escape_sql(c['phone'])}, {escape_sql(c['city'])}, {escape_sql(c['state'])}, {escape_sql(c['postal_code'])}, {escape_sql(c['registered_at'])}) "
        f"ON CONFLICT (customer_id) DO UPDATE SET "
        f"email = EXCLUDED.email, phone = EXCLUDED.phone;"
    )
    # Initialize wallet
    lines.append(
        f"INSERT INTO public.loyalty_wallets (customer_id, points_balance) "
        f"VALUES ({escape_sql(c['customer_id'])}, 0) "
        f"ON CONFLICT (customer_id) DO NOTHING;"
    )
lines.append("")

# 6. ORDERS
lines.append("-- 6. ORDERS (100 Historical Orders with Reconciled Financial Breakdowns)")
with open(os.path.join(base_dir, 'orders.csv'), 'r', encoding='utf-8-sig') as f:
    orders = list(csv.DictReader(f))

for o in orders:
    # subtotal = order_total, discount = 0, delivery_fee = 0
    tot = float(o['order_total_inr'])
    lines.append(
        f"INSERT INTO public.orders ("
        f"order_id, customer_id, ordered_at, order_day, order_time_local, "
        f"delivery_city, delivery_state, delivery_postal_code, delivery_location, "
        f"subtotal_inr, discount_amount_inr, delivery_fee_inr, order_total_inr, "
        f"currency, order_status, payment_status"
        f") VALUES ("
        f"{escape_sql(o['order_id'])}, {escape_sql(o['customer_id'])}, {escape_sql(o['ordered_at'])}, "
        f"{escape_sql(o['order_day'])}, {escape_sql(o['order_time_local'])}, {escape_sql(o['delivery_city'])}, "
        f"{escape_sql(o['delivery_state'])}, {escape_sql(o['delivery_postal_code'])}, {escape_sql(o['delivery_location'])}, "
        f"{tot:.2f}, 0.00, 0.00, {tot:.2f}, {escape_sql(o['currency'])}, "
        f"{escape_sql(o['order_status'])}, {escape_sql(o['payment_status'])}"
        f") ON CONFLICT (order_id) DO UPDATE SET "
        f"order_status = EXCLUDED.order_status, payment_status = EXCLUDED.payment_status;"
    )
lines.append("")

# 7. ORDER ITEMS
lines.append("-- 7. ORDER ITEMS (100 Reconciled Order Items with Flavor Snapshots)")
with open(os.path.join(base_dir, 'order_items.csv'), 'r', encoding='utf-8-sig') as f:
    order_items = list(csv.DictReader(f))

prod_map = {p['product_id']: p for p in products}

for item in order_items:
    p_info = prod_map.get(item['product_id'], {})
    p_name = p_info.get('product_name', 'Vyra Pulse')
    p_flav = p_info.get('flavor', 'Signature')
    lines.append(
        f"INSERT INTO public.order_items ("
        f"order_item_id, order_id, product_id, quantity, unit_price_inr, line_total_inr, product_name_snapshot, flavor_snapshot"
        f") VALUES ("
        f"{escape_sql(item['order_item_id'])}, {escape_sql(item['order_id'])}, {escape_sql(item['product_id'])}, "
        f"{item['quantity']}, {item['unit_price_inr']}, {item['line_total_inr']}, {escape_sql(p_name)}, {escape_sql(p_flav)}"
        f") ON CONFLICT (order_item_id) DO UPDATE SET "
        f"quantity = EXCLUDED.quantity, line_total_inr = EXCLUDED.line_total_inr;"
    )
lines.append("")

with open(output_path, 'w', encoding='utf-8') as out:
    out.write('\n'.join(lines))

print(f"Generated idempotent seed script at {output_path} ({len(lines)} lines)")
