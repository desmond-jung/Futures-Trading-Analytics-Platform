from flask import Blueprint, request, jsonify
from datetime import datetime
from app.db.models import db, Trade
from app.services.metrics import detect_trade_type

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

        db.session.commit()

        return jsonify({
            'message': 'Trade udpated successfully',
            'trade': trade.to_dict()

        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update trade: {str(e)}'}), 500


