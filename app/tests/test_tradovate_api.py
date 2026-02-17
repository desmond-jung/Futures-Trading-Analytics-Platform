#!/usr/bin/env python3
"""
Test script for Tradovate API endpoint.

This script tests the /api/trades/import/tradovate endpoint
by making a POST request to your Flask backend.

Usage:
    python test_tradovate_api.py
    
Make sure your Flask server is running on http://localhost:5001
"""

import requests
import json
import sys

API_URL = "http://localhost:5001"

def test_tradovate_import():
    """
    Test the Tradovate import API endpoint.
    """
    print("="*80)
    print("🧪 TESTING TRADOVATE API ENDPOINT")
    print("="*80)
    
    endpoint = f"{API_URL}/api/trades/import/tradovate"
    
    print(f"\n📡 Making POST request to: {endpoint}")
    
    try:
        # Make POST request
        response = requests.post(
            endpoint,
            json={
                'account': 'default',  # Optional: specify account, or let it auto-detect from Tradovate
                'auto_match': True    # Optional: automatically match orders into trades
            },
            headers={
                'Content-Type': 'application/json'
            },
            timeout=60  # 60 second timeout (Tradovate API calls can take time)
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        # Parse response
        try:
            data = response.json()
        except:
            print(f"❌ Failed to parse JSON response")
            print(f"Response text: {response.text[:500]}")
            return False
        
        # Print results
        print("\n" + "="*80)
        print("📋 RESULTS")
        print("="*80)
        
        if response.status_code == 201:
            print("✅ Import successful!")
        elif response.status_code == 200:
            print("⚠️  Import completed with warnings")
        else:
            print(f"❌ Import failed with status {response.status_code}")
        
        print(f"\n📊 Summary:")
        print(f"  - Orders saved: {data.get('orders_saved', 0)}")
        print(f"  - Trades created: {data.get('trades_created', 0)}")
        print(f"  - Trades matched: {data.get('trades_matched', 0)}")
        print(f"  - Errors: {len(data.get('errors', []))}")
        
        if data.get('warning'):
            print(f"\n⚠️  Warning: {data['warning']}")
        
        if data.get('errors'):
            print(f"\n❌ Errors ({len(data['errors'])}):")
            for err in data['errors'][:10]:  # Show first 10 errors
                print(f"    - {err}")
            if len(data['errors']) > 10:
                print(f"    ... and {len(data['errors']) - 10} more errors")
        
        if data.get('debug_info'):
            debug = data['debug_info']
            print(f"\n🔍 Debug Info:")
            print(f"  - Fills fetched: {debug.get('fills_fetched', 'N/A')}")
            print(f"  - Filled orders found: {debug.get('filled_orders_count', 'N/A')}")
            print(f"  - Account used: {debug.get('account_used', 'N/A')}")
            print(f"  - Auto-match enabled: {debug.get('auto_match_enabled', 'N/A')}")
        
        if data.get('trades') and len(data['trades']) > 0:
            print(f"\n📋 Sample Trade (first of {len(data['trades'])}):")
            sample = data['trades'][0]
            print(f"  - ID: {sample.get('id', 'N/A')}")
            print(f"  - Symbol: {sample.get('symbol', 'N/A')}")
            print(f"  - Direction: {sample.get('direction', 'N/A')}")
            print(f"  - Quantity: {sample.get('quantity', 'N/A')}")
            print(f"  - Entry Price: {sample.get('entry_price', 'N/A')}")
            print(f"  - Exit Price: {sample.get('exit_price', 'N/A')}")
            print(f"  - PnL: ${sample.get('pnl', 'N/A')}")
            print(f"  - Fills: {len(sample.get('fills', []))} orders")
        
        print("\n" + "="*80)
        print("✅ TEST COMPLETE!")
        print("="*80)
        
        return response.status_code in [200, 201]
        
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Could not connect to {API_URL}")
        print("   Make sure your Flask server is running!")
        print("   Start it with: python -m app.main")
        return False
    except requests.exceptions.Timeout:
        print(f"\n❌ ERROR: Request timed out (Tradovate API might be slow)")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("\n💡 Make sure your Flask server is running on http://localhost:5001")
    print("   Press Ctrl+C to cancel, or Enter to continue...\n")
    
    try:
        input()
    except KeyboardInterrupt:
        print("\n❌ Cancelled")
        sys.exit(1)
    
    success = test_tradovate_import()
    sys.exit(0 if success else 1)
