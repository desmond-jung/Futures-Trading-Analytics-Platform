from flask import Blueprint, request, jsonify
from datetime import datetime
from app.db.models import db, Trade
from app.services.metrics import detect_trade_type
from app.utils.csv_parser import parse_and_validate_csv

# create blueprint

trade_bp = Blueprint('trades', __name__)

@trade_bp.route('/api/trades', methods=['POST'])
def insert_trade():
    data = request.get_json()
    required_fields = ['id', 'acc_id', 'symbol', 'direction', 'entry_time', 'exit_time',
                        'entry_price', 'exit_price', 'quantity', 'pnl']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f"Missing required fields: {field}"})
    
    # check if trade already exists
    existing_trade = Trade.query.filter_by(id = data['id']).first()
    if existing_trade:
        return jsonify({'error': f"Trade {data['id']} already exists"})

    # can validate direction values here too

    # create new trade
    try:

        entry_time = datetime.fromisoformat(data['entry_time'])
        exit_time = datetime.fromisoformat(data['exit_time'])

        trade_type = data.get('trade_type')
        if not trade_type:
            trade_type = detect_trade_type(entry_time, exit_time
            )
        trade = Trade(
            id=data['id'],
            acc_id=data['acc_id'],
            symbol=data['symbol'],
            direction=data['direction'].upper(),
            entry_time = datetime.fromisoformat(data['entry_time']),
            exit_time = datetime.fromisoformat(data['exit_time']),
            entry_price=float(data['entry_price']),
            exit_price=float(data['exit_price']),
            quantity = int(data['quantity']),
            pnl = float(data['pnl']),
            strategy = data.get('strategy', None) ,
            trade_type = trade_type
        )

        db.session.add(trade)
        db.session.commit()

        return jsonify({'message': 'Trade inserted successfully', 'trade':trade.to_dict()}), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to insert trade: {str(e)}'}), 500

@trade_bp.route('/api/trades', methods = ['GET'])

# get all trades and filter optionally
def get_trades():
    try:
        symbol = request.args.get('symbol')
        id = request.args.get('id')

        # query
        query = Trade.query

        # Filters if provided in url
        if symbol:
            query = query.filter_by(symbol = symbol)
        if id:
            query = query.filter_by(id = id)
        
        trades = query.all()

        # convert trades object into dictionary
        trades_list = [trade.to_dict() for trade in trades]

        return jsonify({
            'count': len(trades_list),
            'trades': trades_list
        }), 200
    except Exception as e:
        return jsonify({'Error': f'Failed to retrieve trades: {str(e)}'}), 500

@trade_bp.route('/api/trades/<trade_id>', methods=['PATCH'])
def update_trade(trade_id):
    """update trade metadata(trade_type, tags, etc.)"""
    try:
        trade = Trade.query.filter_by(id=trade_id).first()

        if not trade:
            return jsonify({'error': f'Trade {trade_id} could not be updated'})

        data = request.get_json()

        # update trade_type if provided
        if 'trade_type' in data:
            allowed_types = ['day_trade', 'swing', 'long_term']
            if data['trade_type'] not in allowed_types:
                return jsonify({'errpr': f'Invalid trade type, must be from {allowed_types}'}), 400
            trade.trade_type = data['trade_type']
        # update tags if provided
        if 'tags' in data:
            if isinstance(data['tags'], list):
                trade.tags = data['tags']
            else:
                return jsonify({'error': 'tags must be an array'}), 400

        # update notes if provided
        if 'notes' in data:
            trade.notes = data['notes']
            
        db.session.commit()

        return jsonify({
            'message': 'Trade udpated successfully',
            'trade': trade.to_dict()

        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update trade: {str(e)}'}), 500

@trade_bp.route('/api/trades/import', methods=['POST'])
def import_trades_csv():
    """
    NEW FLOW:
    1. Save all CSV rows to orders table (raw data)
    2. Optionally trigger matching (can be done separately)
    """
    import sys
    print("\n" + "="*80, file=sys.stderr)
    print("🔍 DEBUG: CSV Import Started", file=sys.stderr)
    print("="*80, file=sys.stderr)
    
    try:
        # Get CSV data
        csv_text = None
        print(f"📥 DEBUG: Request method = {request.method}", file=sys.stderr)
        print(f"📥 DEBUG: Request content type = {request.content_type}", file=sys.stderr)
        print(f"📥 DEBUG: Has files = {'file' in request.files}", file=sys.stderr)
        print(f"📥 DEBUG: Is JSON = {request.is_json}", file=sys.stderr)
        
        if 'file' in request.files:
            file = request.files['file']
            csv_text = file.read().decode("utf-8")
            print(f"📥 DEBUG: Received CSV file, length = {len(csv_text)} chars", file=sys.stderr)
        elif request.is_json:
            data = request.get_json()
            csv_text = data.get('csv_text') or data.get('csv_data')
            print(f"📥 DEBUG: Received JSON, csv_text length = {len(csv_text) if csv_text else 0} chars", file=sys.stderr)
            print(f"📥 DEBUG: JSON keys = {list(data.keys()) if data else 'None'}", file=sys.stderr)
        
        if not csv_text:
            print("❌ DEBUG: No CSV data found!", file=sys.stderr)
            return jsonify({'error': 'No CSV data provided', 'debug': 'No csv_text or csv_data in request'}), 400
        
        print(f"✅ DEBUG: CSV text received, first 200 chars: {csv_text[:200]}", file=sys.stderr)
        
        # Get account
        account = "default"
        if request.is_json:
            account = request.get_json().get('default_acc_id', account)
        elif request.form:
            account = request.form.get('default_acc_id', account)
        
        print(f"📋 DEBUG: Using account = {account}", file=sys.stderr)
        
        # Step 1: Save raw orders to database
        print(f"\n📦 DEBUG: Step 1 - Saving raw orders to database...", file=sys.stderr)
        from app.utils.csv_parser import save_raw_orders_to_db
        saved_orders, errors = save_raw_orders_to_db(csv_text, account)
        
        print(f"📦 DEBUG: Saved {len(saved_orders)} orders", file=sys.stderr)
        print(f"📦 DEBUG: Encountered {len(errors)} errors/warnings", file=sys.stderr)
        if errors:
            print(f"📦 DEBUG: First 5 errors: {errors[:5]}", file=sys.stderr)
        
        # If no new orders were saved, this can still be a valid idempotent import
        # (e.g. user re-imported the same CSV). In that case, continue so matching
        # can still run on any previously-unmatched filled orders.
        if not saved_orders and not errors:
            print("❌ DEBUG: No orders saved and no errors - CSV may be empty", file=sys.stderr)
            return jsonify({
                'error': 'No orders were saved',
                'errors': ['CSV parsed but produced no rows'],
                'debug': 'CSV text length was 0 or parsing failed'
            }), 400
        
        # Step 2: Match filled orders into trades (position-based matching)
        auto_match = request.get_json().get('auto_match', True) if request.is_json else True
        print(f"\n🔄 DEBUG: Step 2 - Matching orders to trades (auto_match={auto_match})...", file=sys.stderr)
        
        trades_created = 0
        created_trades = []
        filled_count = 0
        match_result = {}
        
        if auto_match:
            from app.utils.csv_parser import process_filled_orders_to_trades
            match_result = process_filled_orders_to_trades(account=account)
            trades_created = match_result.get('trades_created', 0)
            trades_matched = match_result.get('trades_matched', 0)
            filled_count = match_result.get('filled_orders_count', 0)
            errors.extend(match_result.get('errors', []))
            
            print(f"🔄 DEBUG: Matching result:", file=sys.stderr)
            print(f"  - Filled orders found: {filled_count}", file=sys.stderr)
            print(f"  - Trades created: {trades_created}", file=sys.stderr)
            print(f"  - Trades matched (existing): {trades_matched}", file=sys.stderr)
            print(f"  - Errors: {len(match_result.get('errors', []))}", file=sys.stderr)
            
            # Get the created trades from database
            if trades_created > 0:
                # Query the most recently created trades (limit to 50 for response)
                created_trades = Trade.query.order_by(Trade.exit_time.desc()).limit(50).all()
                print(f"🔄 DEBUG: Retrieved {len(created_trades)} trades from database", file=sys.stderr)
            else:
                print(f"⚠️  DEBUG: No trades created! Check matching logic.", file=sys.stderr)
                if match_result.get('errors'):
                    print(f"⚠️  DEBUG: Matching errors: {match_result.get('errors')[:5]}", file=sys.stderr)
        
        # Return response
        response_data = {
            'message': f'Imported {len(saved_orders)} new orders, created {trades_created} trades',
            'orders_saved': len(saved_orders),
            'trades_created': trades_created,
            'trades_matched': trades_matched,  # Existing trades that orders were matched to
            'trades': [t.to_dict() for t in created_trades],
            'errors': errors[:20],  # Limit errors in response
            'debug_info': {
                'filled_orders_count': filled_count,
                'account_used': account,
                'auto_match_enabled': auto_match
            }
        }
        
        # If no trades created but orders were saved, add helpful message
        if trades_created == 0 and len(saved_orders) > 0:
            response_data['warning'] = (
                'Orders were saved but no trades were created. '
                'This might mean there are no filled orders, or matching failed. '
                'Check the errors array for details.'
            )
        
        print(f"\n✅ DEBUG: Returning response:", file=sys.stderr)
        print(f"  - orders_saved: {response_data['orders_saved']}", file=sys.stderr)
        print(f"  - trades_created: {response_data['trades_created']}", file=sys.stderr)
        print(f"  - trades in response: {len(response_data['trades'])}", file=sys.stderr)
        print(f"  - errors: {len(response_data['errors'])}", file=sys.stderr)
        if 'warning' in response_data:
            print(f"  - WARNING: {response_data['warning']}", file=sys.stderr)
        print("="*80 + "\n", file=sys.stderr)
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': f'Failed to import: {str(e)}',
            'orders_saved': 0,
            'trades_created': 0
        }), 500

@trade_bp.route('/api/trades/match', methods=['POST'])
def match_orders():
    """
    Manually trigger order matching.
    Useful for:
    - Re-running matching after fixing issues
    - Matching new orders after import
    - Testing matching logic
    """
    try:
        account = request.get_json().get('account') if request.is_json else None
        
        from app.utils.csv_parser import process_filled_orders_to_trades
        match_result = process_filled_orders_to_trades(account=account)
        
        # Get created trades count
        trades_created = match_result.get('trades_created', 0)
        
        return jsonify({
            'message': f'Created {trades_created} trades',
            'trades_created': trades_created,
            'filled_orders_count': match_result.get('filled_orders_count', 0),
            'errors': match_result.get('errors', [])
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@trade_bp.route('/api/trades/import/tradovate', methods=['POST'])
def import_tradovate():
    """
    Import trades from Tradovate API.
    
    Flow:
    1. Authenticate with Tradovate (using hardcoded creds for now)
    2. Fetch fills/orders from Tradovate
    3. Save fills to database
    4. Match orders into trades
    """
    import sys
    print("\n" + "="*80, file=sys.stderr)
    print("🔍 DEBUG: Tradovate Import Started", file=sys.stderr)
    print("="*80, file=sys.stderr)
    
    try:
        # Get account from request (optional, defaults to "default")
        account = "default"
        if request.is_json:
            account = request.get_json().get('account', account)
        elif request.form:
            account = request.form.get('account', account)
        
        print(f"📋 DEBUG: Using account = {account}", file=sys.stderr)
        
        # Step 1: Authenticate with Tradovate
        print(f"\n🔐 DEBUG: Step 1 - Authenticating with Tradovate...", file=sys.stderr)
        from app.ingestion.tradovate import authenticate, get_fills
        
        if not authenticate():
            print("❌ DEBUG: Tradovate authentication failed!", file=sys.stderr)
            return jsonify({
                'error': 'Failed to authenticate with Tradovate',
                'orders_saved': 0,
                'trades_created': 0
            }), 401
        
        print("✅ DEBUG: Authentication successful", file=sys.stderr)
        
        # Step 2: Fetch fills from Tradovate
        print(f"\n📥 DEBUG: Step 2 - Fetching fills from Tradovate...", file=sys.stderr)
        fills = get_fills()
        
        # Ensure fills is a list
        if not isinstance(fills, list):
            fills = [] if not fills else [fills] if isinstance(fills, dict) else []
        
        if not fills or len(fills) == 0:
            print("⚠️  DEBUG: No fills found from Tradovate", file=sys.stderr)
            return jsonify({
                'message': 'No fills found from Tradovate',
                'orders_saved': 0,
                'trades_created': 0,
                'trades': [],
                'errors': []
            }), 200
        
        print(f"✅ DEBUG: Fetched {len(fills)} fills from Tradovate", file=sys.stderr)
        
        # Determine account from fills if not provided
        if account == "default" and fills and fills[0].get('accountId'):
            account = str(fills[0].get('accountId'))
            print(f"📋 DEBUG: Using account from Tradovate fills: {account}", file=sys.stderr)
        
        # Step 3: Save fills to database
        print(f"\n📦 DEBUG: Step 3 - Saving fills to database...", file=sys.stderr)
        from app.utils.tradovate_parser import save_tradovate_fills_to_db
        
        saved_orders, errors = save_tradovate_fills_to_db(fills, account=account)
        
        print(f"📦 DEBUG: Saved {len(saved_orders)} orders", file=sys.stderr)
        print(f"📦 DEBUG: Encountered {len(errors)} errors/warnings", file=sys.stderr)
        if errors:
            print(f"📦 DEBUG: First 5 errors: {errors[:5]}", file=sys.stderr)
        
        # If no new orders were saved, this can still be a valid idempotent import
        if not saved_orders and not errors:
            print("❌ DEBUG: No orders saved and no errors - Tradovate returned no valid fills", file=sys.stderr)
            return jsonify({
                'error': 'No orders were saved',
                'errors': ['Tradovate returned fills but none could be saved'],
                'orders_saved': 0,
                'trades_created': 0
            }), 400
        
        # Step 4: Match filled orders into trades (position-based matching)
        auto_match = request.get_json().get('auto_match', True) if request.is_json else True
        print(f"\n🔄 DEBUG: Step 4 - Matching orders to trades (auto_match={auto_match})...", file=sys.stderr)
        
        trades_created = 0
        trades_matched = 0
        created_trades = []
        filled_count = 0
        match_result = {}
        
        if auto_match:
            from app.utils.csv_parser import process_filled_orders_to_trades
            match_result = process_filled_orders_to_trades(account=account)
            trades_created = match_result.get('trades_created', 0)
            trades_matched = match_result.get('trades_matched', 0)
            filled_count = match_result.get('filled_orders_count', 0)
            errors.extend(match_result.get('errors', []))
            
            print(f"🔄 DEBUG: Matching result:", file=sys.stderr)
            print(f"  - Filled orders found: {filled_count}", file=sys.stderr)
            print(f"  - Trades created: {trades_created}", file=sys.stderr)
            print(f"  - Trades matched (existing): {trades_matched}", file=sys.stderr)
            print(f"  - Errors: {len(match_result.get('errors', []))}", file=sys.stderr)
            
            # Get the created trades from database
            if trades_created > 0:
                # Query the most recently created trades (limit to 50 for response)
                created_trades = Trade.query.order_by(Trade.exit_time.desc()).limit(50).all()
                print(f"🔄 DEBUG: Retrieved {len(created_trades)} trades from database", file=sys.stderr)
            else:
                print(f"⚠️  DEBUG: No trades created! Check matching logic.", file=sys.stderr)
                if match_result.get('errors'):
                    print(f"⚠️  DEBUG: Matching errors: {match_result.get('errors')[:5]}", file=sys.stderr)
        
        # Return response
        response_data = {
            'message': f'Imported {len(saved_orders)} orders from Tradovate, created {trades_created} trades',
            'orders_saved': len(saved_orders),
            'trades_created': trades_created,
            'trades_matched': trades_matched,  # Existing trades that orders were matched to
            'trades': [t.to_dict() for t in created_trades],
            'errors': errors[:20],  # Limit errors in response
            'debug_info': {
                'filled_orders_count': filled_count,
                'account_used': account,
                'auto_match_enabled': auto_match,
                'fills_fetched': len(fills)
            }
        }
        
        # If no trades created but orders were saved, add helpful message
        if trades_created == 0 and len(saved_orders) > 0:
            response_data['warning'] = (
                'Orders were saved but no trades were created. '
                'This might mean there are no filled orders, or matching failed. '
                'Check the errors array for details.'
            )
        
        print(f"\n✅ DEBUG: Returning response:", file=sys.stderr)
        print(f"  - orders_saved: {response_data['orders_saved']}", file=sys.stderr)
        print(f"  - trades_created: {response_data['trades_created']}", file=sys.stderr)
        print(f"  - trades_matched: {response_data['trades_matched']}", file=sys.stderr)
        print(f"  - trades in response: {len(response_data['trades'])}", file=sys.stderr)
        print(f"  - errors: {len(response_data['errors'])}", file=sys.stderr)
        if 'warning' in response_data:
            print(f"  - WARNING: {response_data['warning']}", file=sys.stderr)
        print("="*80 + "\n", file=sys.stderr)
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ DEBUG: Exception in Tradovate import: {str(e)}", file=sys.stderr)
        print(f"❌ DEBUG: Traceback: {error_trace}", file=sys.stderr)
        return jsonify({
            'error': f'Failed to import from Tradovate: {str(e)}',
            'orders_saved': 0,
            'trades_created': 0
        }), 500