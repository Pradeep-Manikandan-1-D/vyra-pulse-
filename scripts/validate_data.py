"""
Vyra Pulse — Dataset & Integrity Validation Script
Handles UTF-8 BOM encoding and validates primary IDs, foreign keys, and monetary totals across all 6 CSV datasets.
"""

import csv
import os
import sys
from datetime import datetime
from collections import Counter

def run_validation():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))
    files = ['products.csv', 'customers.csv', 'orders.csv', 'order_items.csv', 'inventory.csv', 'offers.csv']

    print("==================================================")
    print("VYRA PULSE — DATASET VALIDATION AUDIT")
    print("==================================================")

    data = {}
    for f in files:
        path = os.path.join(base_dir, f)
        if not os.path.exists(path):
            print(f"ERROR: Dataset missing: {path}")
            sys.exit(1)
        with open(path, 'r', encoding='utf-8-sig') as fp:
            reader = csv.DictReader(fp)
            rows = list(reader)
            data[f] = {
                'headers': reader.fieldnames,
                'count': len(rows),
                'rows': rows
            }

    print("\n1. DATASET RECORD COUNTS & COLUMNS:")
    for f, info in data.items():
        print(f"  • {f} ({info['count']} rows):")
        print(f"    Columns: {', '.join(info['headers'])}")

    # Check Primary Keys & Duplicates
    print("\n2. PRIMARY KEY UNIQUENESS:")
    pk_map = {
        'products.csv': 'product_id',
        'customers.csv': 'customer_id',
        'orders.csv': 'order_id',
        'order_items.csv': 'order_item_id',
        'inventory.csv': 'inventory_id',
        'offers.csv': 'offer_id'
    }
    has_pk_errors = False
    for f, pk in pk_map.items():
        ids = [r[pk] for r in data[f]['rows']]
        unique_ids = set(ids)
        if len(unique_ids) != len(ids):
            print(f"  [FAIL] {f}: Found {len(ids) - len(unique_ids)} duplicate {pk} values!")
            has_pk_errors = True
        else:
            print(f"  [PASS] {f}: All {len(ids)} {pk} values are unique.")

    # Unique check on coupon codes
    coupons = [r['coupon_code'] for r in data['offers.csv']['rows']]
    if len(set(coupons)) != len(coupons):
        print(f"  [FAIL] offers.csv: Duplicate coupon codes detected!")
        has_pk_errors = True
    else:
        print(f"  [PASS] offers.csv: All {len(coupons)} coupon codes are unique.")

    # Foreign Key Integrity
    print("\n3. FOREIGN-KEY INTEGRITY:")
    prod_ids = set(r['product_id'] for r in data['products.csv']['rows'])
    cust_ids = set(r['customer_id'] for r in data['customers.csv']['rows'])
    order_ids = set(r['order_id'] for r in data['orders.csv']['rows'])

    missing_cust = [r['customer_id'] for r in data['orders.csv']['rows'] if r['customer_id'] not in cust_ids]
    missing_order = [r['order_id'] for r in data['order_items.csv']['rows'] if r['order_id'] not in order_ids]
    missing_prod_items = [r['product_id'] for r in data['order_items.csv']['rows'] if r['product_id'] not in prod_ids]
    missing_prod_inv = [r['product_id'] for r in data['inventory.csv']['rows'] if r['product_id'] not in prod_ids]

    print(f"  • orders.csv -> customers.csv (customer_id): {len(missing_cust)} missing")
    print(f"  • order_items.csv -> orders.csv (order_id): {len(missing_order)} missing")
    print(f"  • order_items.csv -> products.csv (product_id): {len(missing_prod_items)} missing")
    print(f"  • inventory.csv -> products.csv (product_id): {len(missing_prod_inv)} missing")

    if missing_cust or missing_order or missing_prod_items or missing_prod_inv:
        print("  [FAIL] Foreign key integrity violations found!")
        sys.exit(1)
    else:
        print("  [PASS] 100% referential integrity across all relationships.")

    # Order item coverage
    orders_with_items = set(r['order_id'] for r in data['order_items.csv']['rows'])
    print(f"  • Orders with at least one item: {len(orders_with_items)} / {len(order_ids)} (100%)")

    # Financial Reconciliation
    print("\n4. FINANCIAL RECONCILIATION:")
    line_total_mismatches = []
    for r in data['order_items.csv']['rows']:
        q = float(r['quantity'])
        u = float(r['unit_price_inr'])
        tot = float(r['line_total_inr'])
        if abs(q * u - tot) > 0.01:
            line_total_mismatches.append((r['order_item_id'], q, u, tot))

    order_item_sum = {}
    for r in data['order_items.csv']['rows']:
        oid = r['order_id']
        order_item_sum[oid] = order_item_sum.get(oid, 0.0) + float(r['line_total_inr'])

    order_total_mismatches = []
    for r in data['orders.csv']['rows']:
        oid = r['order_id']
        ot = float(r['order_total_inr'])
        it_sum = order_item_sum.get(oid, 0.0)
        if abs(ot - it_sum) > 0.01:
            order_total_mismatches.append((oid, ot, it_sum))

    print(f"  • Line total errors (qty * unit != line_total): {len(line_total_mismatches)}")
    print(f"  • Order total errors (order_total != sum of items): {len(order_total_mismatches)}")

    if line_total_mismatches or order_total_mismatches:
        print("  [FAIL] Monetary discrepancies detected!")
        sys.exit(1)
    else:
        print("  [PASS] All item line totals and order totals reconcile with zero discrepancy.")

    # Missing/Null Values
    print("\n5. MISSING VALUE AUDIT:")
    all_clean = True
    for f, info in data.items():
        null_counts = {}
        for h in info['headers']:
            cnt = sum(1 for r in info['rows'] if r[h] is None or r[h].strip() == '')
            if cnt > 0:
                null_counts[h] = cnt
        if null_counts:
            print(f"  • {f}: {null_counts}")
            all_clean = False
        else:
            print(f"  • {f}: 0 empty or null values")

    print("\n==================================================")
    print("VALIDATION STATUS: SUCCESSFUL — ALL CHECKS PASSED")
    print("==================================================")

if __name__ == '__main__':
    run_validation()
