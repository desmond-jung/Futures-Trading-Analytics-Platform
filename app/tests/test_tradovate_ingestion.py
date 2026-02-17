#!/usr/bin/env python3
"""
Test script for Tradovate ingestion.

This script:
1. Authenticates with Tradovate API
2. Fetches fills from Tradovate
3. Saves fills to database
4. Matches orders into trades
5. Shows results

Usage:
    python test_tradovate_ingestion.py
"""

import sys
import os

# Add the project root to the path (go up two levels from tests folder)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from flask import Flask
from app.db.models import db, Trade, Order
from app.ingestion.tradovate import authenticate, get_fills
from app.utils.tradovate_parser import save_tradovate_fills_to_db
from app.utils.csv_parser import process_filled_orders_to_trades

def test_tradovate_ingestion():
    """
    Test the full Tradovate ingestion pipeline.
    """
    print("="*80)
    print("🧪 TESTING TRADOVATE INGESTION")
    print("="*80)
    
    # Create minimal Flask app for database access
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://desmondjung@localhost/trading_journal'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'connect_args': {'options': '-csearch_path=trade'}
    }
    
    db.init_app(app)
    
    with app.app_context():
        # Create database tables if they don't exist
        db.create_all()
        
        # Step 1: Authenticate with Tradovate
        print("\n" + "="*80)
        print("🔐 STEP 1: AUTHENTICATING WITH TRADOVATE")
        print("="*80)
        
        if not authenticate():
            print("❌ Authentication failed!")
            return False
        
        print("✅ Authentication successful!")
        
        # Step 2: Fetch fills from Tradovate
        print("\n" + "="*80)
        print("📥 STEP 2: FETCHING FILLS FROM TRADOVATE")
        print("="*80)
        
        fills = get_fills()
        
        # Ensure fills is a list
        if not isinstance(fills, list):
            fills = [] if not fills else [fills] if isinstance(fills, dict) else []
        
        if not fills or len(fills) == 0:
            print("⚠️  No fills found from Tradovate")
            return False
        
        print(f"✅ Fetched {len(fills)} fills from Tradovate")
        
        # Show sample fill
        if len(fills) > 0:
            print(f"\n📋 Sample fill (first one):")
            sample = fills[0]
            print(f"  - Fill ID: {sample.get('id')}")
            print(f"  - Order ID: {sample.get('orderId')}")
            print(f"  - Account ID: {sample.get('accountId')}")
            print(f"  - Action: {sample.get('action')}")
            print(f"  - Quantity: {sample.get('qty')}")
            print(f"  - Price: {sample.get('price')}")
            print(f"  - Timestamp: {sample.get('timestamp')}")
        
        # Step 3: Save fills to database
        print("\n" + "="*80)
        print("💾 STEP 3: SAVING FILLS TO DATABASE")
        print("="*80)
        
        # Get account from first fill, or use "default"
        account = "default"
        if fills and fills[0].get('accountId'):
            account = str(fills[0].get('accountId'))
        
        saved_orders, errors = save_tradovate_fills_to_db(fills, account=account)
        
        print(f"✅ Saved {len(saved_orders)} orders to database")
        if errors:
            print(f"⚠️  {len(errors)} errors/warnings:")
            for err in errors[:10]:  # Show first 10 errors
                print(f"    - {err}")
            if len(errors) > 10:
                print(f"    ... and {len(errors) - 10} more errors")
        
        if len(saved_orders) == 0:
            print("⚠️  No orders were saved. Check errors above.")
            return False
        
        # Show sample saved order
        if len(saved_orders) > 0:
            sample_order = saved_orders[0]
            print(f"\n📋 Sample saved order:")
            print(f"  - ID: {sample_order.id}")
            print(f"  - Order ID: {sample_order.order_id}")
            print(f"  - Account: {sample_order.account}")
            print(f"  - B/S: {sample_order.b_s}")
            print(f"  - Contract: {sample_order.contract}")
            print(f"  - Price: {sample_order.avg_price}")
            print(f"  - Quantity: {sample_order.filled_qty}")
            print(f"  - Fill Time: {sample_order.fill_time}")
        
        # Step 4: Match orders into trades
        print("\n" + "="*80)
        print("🔄 STEP 4: MATCHING ORDERS INTO TRADES")
        print("="*80)
        
        match_result = process_filled_orders_to_trades(account=account)
        trades_created = match_result.get('trades_created', 0)
        trades_matched = match_result.get('trades_matched', 0)
        filled_count = match_result.get('filled_orders_count', 0)
        
        print(f"✅ Found {filled_count} filled orders")
        print(f"✅ Created {trades_created} new trades")
        print(f"✅ Matched {trades_matched} existing trades")
        
        if match_result.get('errors'):
            print(f"⚠️  {len(match_result['errors'])} errors during matching:")
            for err in match_result['errors'][:5]:
                print(f"    - {err}")
        
        # Step 5: Show results
        print("\n" + "="*80)
        print("📊 STEP 5: VERIFICATION")
        print("="*80)
        
        # Count orders in database
        total_orders = Order.query.count()
        tradovate_orders = Order.query.filter(Order.id.like('fill-%')).count()
        
        print(f"\n📊 Database state:")
        print(f"  - Total orders: {total_orders}")
        print(f"  - Tradovate orders (fill-*): {tradovate_orders}")
        print(f"  - Total trades: {Trade.query.count()}")
        
        # Show sample trade if any were created
        if trades_created > 0:
            sample_trade = Trade.query.order_by(Trade.exit_time.desc()).first()
            if sample_trade:
                print(f"\n📋 Sample trade:")
                print(f"  - ID: {sample_trade.id}")
                print(f"  - Symbol: {sample_trade.symbol}")
                print(f"  - Direction: {sample_trade.direction}")
                print(f"  - Quantity: {sample_trade.quantity}")
                print(f"  - Entry Price: {sample_trade.entry_price}")
                print(f"  - Exit Price: {sample_trade.exit_price}")
                print(f"  - PnL: {sample_trade.pnl}")
                print(f"  - Fills: {len(sample_trade.fills) if sample_trade.fills else 0} orders")
        
        print("\n" + "="*80)
        print("✅ TEST COMPLETE!")
        print("="*80)
        
        return True

if __name__ == '__main__':
    try:
        success = test_tradovate_ingestion()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
