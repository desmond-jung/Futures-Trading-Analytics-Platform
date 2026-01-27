from app.main import app
from app.db.models import db, Trade
from datetime import datetime

TEST_TRADES = [
    {
        "id": "TRADE001",
        "acc_id": "ACC01",
        "symbol": "MGC",
        "direction": "LONG",
        "entry_time": "2026-01-15T09:30:00",
        "exit_time": "2026-01-15T15:45:00",
        "entry_price": 4231.5,
        "exit_price": 4500.0,
        "quantity": 1,
        "pnl": 268.5,
        "strategy": "ICT 22"
    },
    {
        "id": "TRADE002",
        "acc_id": "ACC01",
        "symbol": "NQ",
        "direction": "LONG",
        "entry_time": "2026-01-15T10:15:00",
        "exit_time": "2026-01-15T14:30:00",
        "entry_price": 25000.0,
        "exit_price": 25674.3,
        "quantity": 1,
        "pnl": 674.3,
        "strategy": "Silver Bullet"
    },
    {
        "id": "TRADE003",
        "acc_id": "ACC01",
        "symbol": "MGC",
        "direction": "SHORT",
        "entry_time": "2026-01-16T10:00:00",
        "exit_time": "2026-01-16T14:30:00",
        "entry_price": 4550.0,
        "exit_price": 4400.0,
        "quantity": 1,
        "pnl": 150.0,
        "strategy": "ICT 22"
    },
    {
        "id": "TRADE004",
        "acc_id": "ACC01",
        "symbol": "NQ",
        "direction": "SHORT",
        "entry_time": "2026-01-16T11:00:00",
        "exit_time": "2026-01-16T15:00:00",
        "entry_price": 25800.0,
        "exit_price": 25650.0,
        "quantity": 1,
        "pnl": 150.0,
        "strategy": "Power Hour"
    },
    {
            "id": "TRADE005",
            "acc_id": "ACC01",
            "symbol": "MGC",
            "direction": "LONG",
            "entry_time": "2026-01-17T09:30:00",
            "exit_time": "2026-01-17T13:00:00",
            "entry_price": 4450.0,
            "exit_price": 4400.0,
            "quantity": 1,
            "pnl": -50.0,
            "strategy": "ICT 22"
        }
]

def clear_database():
    print("Clearing database")

    try:
        Trade.query.delete()
        db.session.commit()
        print("Database cleared")
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error clearing database: {str(e)}")
        return False

def ingest_trades():
    print("Inserting trades")

    inserted_count = 0
    skipped = 0

    for trade_data in TEST_TRADES:
        try:
            # check if trade exists
            existing_trade = Trade.query.filter_by(id=trade_data['id']).first()
            if existing_trade:
                print(f"Trade with id: {trade_data['id']} already exists")
                skipped += 1
                continue
        
            trade = Trade(
                id=trade_data['id'],
                acc_id=trade_data['acc_id'],
                symbol=trade_data['symbol'],
                direction=trade_data['direction'].upper(),
                entry_time=datetime.fromisoformat(trade_data['entry_time']),
                exit_time=datetime.fromisoformat(trade_data['exit_time']),
                entry_price=float(trade_data['entry_price']),
                exit_price=float(trade_data['exit_price']),
                quantity=int(trade_data['quantity']),
                pnl=float(trade_data['pnl']),
                strategy=trade_data.get('strategy', None)
        
            )

            db.session.add(trade)
            db.session.commit()
            print(f"Inserted trade {trade_data['id']}: {trade_data['symbol']} {trade_data['direction']} {trade_data['pnl']} ")
            inserted_count += 1
        
        except Exception as e:
            db.session.rollback()
            print(f"Error inserting trade{trade_data['id']}: {str(e)}")
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Inserted: {inserted_count} trades")
    print(f"   ⏭️  Skipped: {skipped} trades")
    print(f"   📈 Total trades in database: {Trade.query.count()}")

def main():

    print("Starting ingestion script")

    with app.app_context():
        if not clear_database():
            print("Fail to clear database")
            return 
        
        ingest_trades()

        print("\n✨ Done! Database seeded successfully.")
        print("\n💡 Test the API:")
        print("   curl http://localhost:5001/api/pnl/daily")

if __name__ == '__main__':
    main()