import unittest
import os
from app.main import app
from app.db.models import db, Trade, Order

class TestTrades(unittest.TestCase):
    """ Set up test client and database before test"""
    print("\n----- Setting up test client and database-----")
    # use separate test db
    def setUp(self):
        print("Starting setUp Test")
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://desmondjung@localhost/trading_journal_test'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            'connect_args': {'options': '-csearch_path=trade'}
        }
        
        # test client
        self.app = app.test_client()

        # create tables in test db
        with app.app_context():
            db.create_all()
        print("Test database tables created")

    # drop all tables after each test
    def tearDown(self):
        print("Starting tearDown Test")
        with app.app_context():
            # Delete all data first (must be done before dropping tables)
            try:
                Trade.query.delete()
                Order.query.delete()
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Warning: Error during cleanup: {e}")
            # Then drop tables
            db.session.remove()
            try:
                db.drop_all()
            except Exception as e:
                print(f"Warning: Error dropping tables: {e}")
        print("Cleaned up test db")
        
    def test_insert_trade(self):
        print("Starting insert_trade test")
        # Ensure database is clean before this test
        with app.app_context():
            Trade.query.delete()
            Order.query.delete()
            db.session.commit()
        
        trade_data = {
            'id': 'TEST003',
            'acc_id': 'ACC01',
            'symbol': 'MGC',
            'direction': 'LONG',
            'entry_time': '2024-01-15T09:30:00',  
            'exit_time': '2024-01-15T15:45:00',  
            'entry_price': 4231.5,
            'exit_price': 4500.0,
            'quantity': 1,
            'pnl': 268.5,  # (4500 - 4231.5) * 1 = 268.5
            'strategy': 'ICT 22'
        }

        print(f"Sending trade data: {trade_data}")
        response = self.app.post('/api/trades', json=trade_data)
        print(f"Response code: {response.status_code}")
        response_data = response.get_json()

        if response.status_code == 201:
            print("SUCCESS: Trade inserted successfully")
            self.response_data = response_data
            self.trade_data = trade_data

            print(f"   Trade ID: {response_data.get('trade', {}).get('id', 'N/A')}")
        else:
            print(f"FAILED: Expected status 201, got {response.status_code}")
            print(f"Response: {response_data}")
            if 'error' in response_data:
                print(f"Error: {response_data['error']}")
            else:
                print(f"Response data:{response_data}")
            # check for 201 created status code
            self.assertEqual(response.status_code, 201)
    
    def test_get_trades(self):
        print("Starting get_trades test")
        # Ensure database is clean before this test
        with app.app_context():
            Trade.query.delete()
            Order.query.delete()
            db.session.commit()
        
        response = self.app.get('/api/trades')
        response_data = response.get_json()

        print(f"Response data: {response_data}")

        self.assertEqual(response_data['count'], 0)
        self.assertEqual(response_data['trades'], [])
    
    def test_get_all_trades_with_data(self):
        print("Starting get_all_trades_with_data test")
        # Ensure database is clean before this test
        with app.app_context():
            Trade.query.delete()
            Order.query.delete()
            db.session.commit()
        
        trade_data = [{
            'id': 'TEST001',
            'acc_id': 'ACC01',
            'symbol': 'MGC',
            'direction': 'LONG',
            'entry_time': '2024-01-15T09:30:00',
            'exit_time': '2024-01-15T15:45:00',
            'entry_price': 4231.5,
            'exit_price': 4500.0,
            'quantity': 1,
            'pnl': 268.5,
            'strategy': 'ICT 22'
        },
        {
            'id': 'TEST002',
            'acc_id': 'ACC01',
            'symbol': 'NQ',
            'direction': 'LONG',
            'entry_time': '2024-01-15T09:30:00',
            'exit_time': '2024-01-15T15:45:00',
            'entry_price': 25000,
            'exit_price': 25674.3,
            'quantity': 1,
            'pnl': 674.3,
            'strategy': 'ICT 22'
        }
        ]

        print(f"\n Starting insertions")

        for trade in trade_data:
            print(f"Inserting trade: {trade['id']}")
            insert_response = self.app.post('/api/trades', json=trade)
            insert_data = insert_response.get_json()
        
            print(f"   Status code: {insert_response.status_code}")
            print(f"   Response: {insert_data}")
            
            if insert_response.status_code != 201:
                print(f"   ❌ FAILED to insert {trade['id']}")
            else:
                print(f"   ✅ Successfully inserted {trade['id']}")
            
            self.assertEqual(insert_response.status_code, 201, 
                            f"Failed to insert trade {trade['id']}: {insert_data}")
        
        print(f"\n📥 Now getting all trades...")
        response = self.app.get('/api/trades')
        response_data = response.get_json()
        
        print(f"   Retrieved {response_data['count']} trades")
        print(f"   Trades: {response_data.get('trades', [])}")

    def test_daily_pnl_empty(self):
        """Starting daily_pnl_empty test"""
        response = self.app.get('/api/pnl/daily')
        response_data = response.get_json()

        print(f"\n📊 Response status: {response.status_code}")
        print(f"📊 Response data: {response_data}")
        #print(f"\n📊 Daily PnL (empty): {response_data}")
        if response.status_code != 200:
            print(f"Error: {response_data.get('error', 'Unknown error')}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data['total_pnl'], 0.0)
        self.assertEqual(response_data['total_trades'], 0)
        self.assertEqual(len(response_data['data']), 0)

    def test_daily_pnl_single_day(self):
        """Starting Test daily PnL with trades on one day"""
        # Ensure database is clean before this test
        with app.app_context():
            Trade.query.delete()
            Order.query.delete()
            db.session.commit()
        
        # Insert 3 trades on same trading day
        # IMPORTANT: All exit times must be BEFORE 3pm PST to be on the same trading day
        # Trading day logic: trades after 3pm PST belong to the NEXT trading day
        trades = [
            {
                'id': 'TEST_PNL_001',
                'acc_id': 'ACC01',
                'symbol': 'MGC',
                'direction': 'LONG',
                'entry_time': '2024-01-15T09:30:00',
                'exit_time': '2024-01-15T14:00:00',  # Changed from 15:45 to 14:00 (before 3pm)
                'entry_price': 4231.5,
                'exit_price': 4500.0,
                'quantity': 1,
                'pnl': 268.5,
                'strategy': 'Test'
            },
            {
                'id': 'TEST_PNL_002',
                'acc_id': 'ACC01',
                'symbol': 'NQ',
                'direction': 'LONG',
                'entry_time': '2024-01-15T10:00:00',
                'exit_time': '2024-01-15T14:00:00',  # Already before 3pm
                'entry_price': 25000,
                'exit_price': 25100,
                'quantity': 1,
                'pnl': 100.0,
                'strategy': 'Test'
            },
            {
                'id': 'TEST_PNL_003',
                'acc_id': 'ACC01',
                'symbol': 'MGC',
                'direction': 'SHORT',
                'entry_time': '2024-01-15T11:00:00',
                'exit_time': '2024-01-15T13:00:00',  # Already before 3pm
                'entry_price': 4500,
                'exit_price': 4480,
                'quantity': 1,
                'pnl': 20.0,
                'strategy': 'Test'
            }
        ]
        
        # Insert trades
        for trade in trades:
            self.app.post('/api/trades', json=trade)
        
        # Get daily PnL
        response = self.app.get('/api/pnl/daily')
        response_data = response.get_json()
        
        print(f"\n📊 Daily PnL: {response_data}")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data['total_pnl'], 388.5)
        self.assertEqual(response_data['total_trades'], 3)
        self.assertEqual(len(response_data['data']), 1)
        
        # Check the single day data
        day_data = response_data['data'][0]
        self.assertEqual(day_data['date'], '2024-01-15')
        self.assertEqual(day_data['pnl'], 388.5)
        self.assertEqual(day_data['trade_count'], 3)
        self.assertEqual(day_data['winning_trades'], 3)
        self.assertEqual(day_data['losing_trades'], 0)

    def test_daily_pnl_multiple_days(self):
        """Starting Test daily PnL with trades on multiple days"""
        # Ensure database is clean before this test
        with app.app_context():
            Trade.query.delete()
            Order.query.delete()
            db.session.commit()
        
        trades = [
            # Trading Day 1: 2024-01-15 (all exits before 3pm PST)
            {
                'id': 'TEST_DAY1_001',
                'acc_id': 'ACC01',
                'symbol': 'MGC',
                'direction': 'LONG',
                'entry_time': '2024-01-15T09:30:00',
                'exit_time': '2024-01-15T14:00:00',  # Changed from 15:45 to 14:00 (before 3pm)
                'entry_price': 4000,
                'exit_price': 4100,
                'quantity': 1,
                'pnl': 100.0,
                'strategy': 'Test'
            },
            {
                'id': 'TEST_DAY1_002',
                'acc_id': 'ACC01',
                'symbol': 'NQ',
                'direction': 'LONG',
                'entry_time': '2024-01-15T10:00:00',
                'exit_time': '2024-01-15T14:00:00',  # Already before 3pm
                'entry_price': 25000,
                'exit_price': 25050,
                'quantity': 1,
                'pnl': 50.0,
                'strategy': 'Test'
            },
            # Trading Day 2: 2024-01-16 (all exits before 3pm PST)
            {
                'id': 'TEST_DAY2_001',
                'acc_id': 'ACC01',
                'symbol': 'MGC',
                'direction': 'LONG',
                'entry_time': '2024-01-16T09:30:00',
                'exit_time': '2024-01-16T14:00:00',  # Changed from 15:45 to 14:00 (before 3pm)
                'entry_price': 4100,
                'exit_price': 4050,
                'quantity': 1,
                'pnl': -50.0,
                'strategy': 'Test'
            },
            {
                'id': 'TEST_DAY2_002',
                'acc_id': 'ACC01',
                'symbol': 'NQ',
                'direction': 'LONG',
                'entry_time': '2024-01-16T10:00:00',
                'exit_time': '2024-01-16T14:00:00',  # Already before 3pm
                'entry_price': 25000,
                'exit_price': 25200,
                'quantity': 1,
                'pnl': 200.0,
                'strategy': 'Test'
            }
        ]
        
        # Insert trades
        for trade in trades:
            self.app.post('/api/trades', json=trade)
        
        # Get daily PnL
        response = self.app.get('/api/pnl/daily')
        response_data = response.get_json()
        
        print(f"\n📊 Daily PnL (multiple days):")
        for day in response_data['data']:
            print(f"   {day['date']}: ${day['pnl']} ({day['trade_count']} trades)")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data['total_pnl'], 300.0)
        self.assertEqual(response_data['total_trades'], 4)
        self.assertEqual(len(response_data['data']), 2)
        
        # Check day 1
        day1 = response_data['data'][0]
        self.assertEqual(day1['date'], '2024-01-15')
        self.assertEqual(day1['pnl'], 150.0)
        self.assertEqual(day1['trade_count'], 2)
        
        # Check day 2
        day2 = response_data['data'][1]
        self.assertEqual(day2['date'], '2024-01-16')
        self.assertEqual(day2['pnl'], 150.0)
        self.assertEqual(day2['trade_count'], 2)
        self.assertEqual(day2['winning_trades'], 1)
        self.assertEqual(day2['losing_trades'], 1)
            


if __name__ == '__main__':
    unittest.main(buffer=False)

        