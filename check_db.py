#!/usr/bin/env python3
"""Quick script to check database state"""
from app.main import app
from app.db.models import Trade, Order

with app.app_context():
    trade_count = Trade.query.count()
    order_count = Order.query.count()
    
    print(f"📊 Database State:")
    print(f"  - Trades: {trade_count}")
    print(f"  - Orders: {order_count}")
    
    if trade_count > 0:
        # Show a sample trade
        sample = Trade.query.first()
        print(f"\n📋 Sample Trade:")
        print(f"  - ID: {sample.id}")
        print(f"  - Symbol: {sample.symbol}")
        print(f"  - Exit Time: {sample.exit_time}")
        print(f"  - PnL: {sample.pnl}")
