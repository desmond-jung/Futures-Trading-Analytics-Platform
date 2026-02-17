#!/usr/bin/env python3
"""
Script to recalculate PnL for all existing trades using contract multipliers.

This is useful if trades were created before the multiplier logic was added.
"""

import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from app.db.models import db, Trade
from app.utils.contract_multipliers import get_contract_multiplier

def recalculate_all_pnl():
    """
    Recalculate PnL for all trades using contract multipliers.
    """
    print("="*80)
    print("💰 RECALCULATING PNL FOR ALL TRADES")
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
        # Get all trades
        all_trades = Trade.query.all()
        total_trades = len(all_trades)
        
        print(f"\n📊 Found {total_trades} trades to recalculate")
        
        if total_trades == 0:
            print("  ✓ No trades to recalculate")
            return True
        
        updated_count = 0
        unchanged_count = 0
        
        for trade in all_trades:
            # Get multiplier for this contract
            multiplier = get_contract_multiplier(trade.symbol)
            
            # Calculate old PnL
            old_pnl = float(trade.pnl)
            
            # Recalculate PnL with multiplier
            if trade.direction == 'LONG':
                new_pnl = (float(trade.exit_price) - float(trade.entry_price)) * trade.quantity * multiplier
            else:  # SHORT
                new_pnl = (float(trade.entry_price) - float(trade.exit_price)) * trade.quantity * multiplier
            
            # Update if PnL changed
            if abs(new_pnl - old_pnl) > 0.01:  # More than 1 cent difference
                trade.pnl = new_pnl
                updated_count += 1
                print(f"  ✓ {trade.symbol} {trade.direction}: ${old_pnl:.2f} → ${new_pnl:.2f} (multiplier: {multiplier})")
            else:
                unchanged_count += 1
        
        # Commit all changes
        if updated_count > 0:
            db.session.commit()
            print(f"\n✅ Updated {updated_count} trades")
            print(f"   {unchanged_count} trades unchanged (already correct)")
        else:
            print(f"\n✅ All {unchanged_count} trades already have correct PnL values")
        
        return True

if __name__ == '__main__':
    success = recalculate_all_pnl()
    sys.exit(0 if success else 1)
