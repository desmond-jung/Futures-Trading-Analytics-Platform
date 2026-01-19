from flask import Blueprint, request, jsonify
from datetime import datetime
from app.db.models import db, Trade

pnl_bp = Blueprint('pnl', __name__)

@pnl_bp.route('/api/pnl/daily', methods = ['GET'])
def get_daily_pnl():
    """Calculate daily Pnl Aggregation"""
    try:
        # parameters to filter the aggregations by
        # start date
        start_date = request.args.get('start_date')
        # end date
        end_date = request.args.get('end_date')
        # symbol
        symbol = request.args.get('symbol')

        # get all trades
        query = Trade.query

        # apply filters
        if symbol:
            query = query.filter_by(symbol=symbol)
        if start_date:
            start = datetime.fromisoformat(start_date)
            query = query.filter(Trade.exit_time >= start)
        if end_date:
            end = datetime.fromisoformat(end_date)
            query = query.filter(Trade.exit_time <= end)
        
        trades = query.all()

        daily_pnl = {}

        for trade in trades:
            trade_date = trade.exit_time.date().isoformat()

            # Initialize date entry if not exists
            if trade_date not in daily_pnl:
                daily_pnl[trade_date] = {
                    'date': trade_date,
                    'pnl': 0.0,
                    'trade_count': 0,
                    'winning_trades': 0,
                    'losing_trades': 0
                }

            trade_pnl = float(trade.pnl)
            daily_pnl[trade_date]['pnl'] += trade_pnl
            daily_pnl[trade_date]['trade_count'] += 1

            # track wins and losses
            if trade_pnl > 0 :
                daily_pnl[trade_date]['winning_trades'] += 1
            elif trade_pnl < 0 :
                daily_pnl[trade_date]['losing_trades'] += 1

        # convert to list and sort by date
        daily_data = sorted(daily_pnl.values(), key=lambda x: x['date'])
        # totals
        total_pnl = sum(day['pnl'] for day in daily_data)
        total_trades = sum(day['trade_count'] for day in daily_data)

        return jsonify({
            'period': 'daily',
            'total_pnl': round(total_pnl, 2),
            'total_trades': total_trades,
            'data': daily_data
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to calculate daily PnL: {str(e)}'}), 500
