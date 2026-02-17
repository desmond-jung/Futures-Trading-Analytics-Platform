#!/usr/bin/env python3
"""
Script to wipe all trades and orders from the database.

Usage:
    python wipe_and_reimport.py
"""

import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from app.db.models import db, Trade, Order

def wipe_database():
    """
    Wipe all trades and orders from the database.
    """
    print("="*80)
    print("🗑️  WIPING DATABASE")
    print("="*80)
    
    # Create minimal Flask app (without CORS) for database access
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://desmondjung@localhost/trading_journal'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'connect_args': {'options': '-csearch_path=trade'}
    }
    
    db.init_app(app)
    
    with app.app_context():
        # Get current counts
        trades_count = Trade.query.count()
        orders_count = Order.query.count()
        
        print(f"\n📊 Current state:")
        print(f"  - Trades in database: {trades_count}")
        print(f"  - Orders in database: {orders_count}")
        
        if trades_count == 0 and orders_count == 0:
            print(f"\n✅ Database is already empty!")
            return True
        
        # Confirm deletion
        print(f"\n⚠️  WARNING: This will delete ALL trades and orders!")
        response = input("Type 'yes' to confirm: ")
        if response.lower() != 'yes':
            print("❌ Cancelled. Database not wiped.")
            return False
        
        # Step 1: Delete all trades
        print(f"\n🗑️  Deleting all trades...")
        Trade.query.delete()
        print(f"  ✓ Deleted {trades_count} trades")
        
        # Step 2: Delete all orders
        print(f"\n🗑️  Deleting all orders...")
        Order.query.delete()
        print(f"  ✓ Deleted {orders_count} orders")
        
        # Commit deletions
        db.session.commit()
        print(f"\n✅ Database wiped clean!")
        
        # Verify
        final_trades = Trade.query.count()
        final_orders = Order.query.count()
        print(f"\n📊 Verification:")
        print(f"  - Trades remaining: {final_trades}")
        print(f"  - Orders remaining: {final_orders}")
        
        return True

if __name__ == '__main__':
    success = wipe_database()
    sys.exit(0 if success else 1)
