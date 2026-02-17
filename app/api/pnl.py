from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import pytz
from app.db.models import db, Trade

pnl_bp = Blueprint('pnl', __name__)

def get_trading_day(dt: datetime, market_close_hour: int = 15, timezone: str = 'America/Los_Angeles') -> str:
    """
    Convert a datetime to a trading day string.
    
    Trading day logic:
    - Trading day closes at market_close_hour (default 3pm PST = 15:00)
    - If time is before market close (including exactly 3:00pm), it's the current calendar day
    - If time is after market close (after 3:00pm), it's the next calendar day
    
    Example:
    - Jan 15 2:59pm PST → Trading day: 2026-01-15
    - Jan 15 3:00pm PST → Trading day: 2026-01-15 (still current day)
    - Jan 15 3:01pm PST → Trading day: 2026-01-16 (next day)
    - Jan 15 4pm PST → Trading day: 2026-01-16 (next day)
    - Jan 16 1pm PST → Trading day: 2026-01-16
    
    Args:
        dt: datetime object (assumed to be in UTC or naive)
        market_close_hour: Hour when market closes (15 = 3pm)
        timezone: Timezone string (default: 'America/Los_Angeles' for PST)
    
    Returns:
        ISO date string (YYYY-MM-DD) representing the trading day
    """
    # Convert to PST timezone
    pst = pytz.timezone(timezone)
    
    # If datetime is naive (no timezone), assume it's already in the target timezone
    if dt.tzinfo is None:
        dt = pst.localize(dt)
    else:
        # Convert from UTC (or other timezone) to PST
        dt = dt.astimezone(pst)
    
    # Create market close time for comparison (3:00pm on the same date)
    market_close_time = dt.replace(hour=market_close_hour, minute=0, second=0, microsecond=0)
    
    # Trading day logic:
    # - If time <= 3:00pm: belongs to current calendar day's trading day
    # - If time > 3:00pm: belongs to next calendar day's trading day
    # 
    # Example for trading day "2026-01-15":
    # - 2026-01-14 3:00:00pm → Trading day 2026-01-14 (not 2026-01-15)
    # - 2026-01-14 3:00:01pm → Trading day 2026-01-15 (included)
    # - 2026-01-15 3:00:00pm → Trading day 2026-01-15 (included)
    # - 2026-01-15 3:00:01pm → Trading day 2026-01-16 (not included)
    
    if dt <= market_close_time:
        # At or before market close: use current calendar date
        trading_date = dt.date()
    else:
        # After market close: use next calendar date
        trading_date = (dt + timedelta(days=1)).date()
    
    return trading_date.isoformat()

def get_trading_day_range(trading_day_str: str, market_close_hour: int = 15, timezone: str = 'America/Los_Angeles'):
    """
    Convert a trading day string to a datetime range (start, end) for database queries.
    
    Trading day "2026-01-15" includes trades that exit:
    - Start: 2026-01-14 3:00:01pm PST (after previous day's market close)
    - End: 2026-01-15 3:00:00pm PST (at current day's market close, inclusive)
    
    This means:
    - Trade at 2026-01-14 3:00:00pm PST → Trading day 2026-01-14 (not included in 2026-01-15)
    - Trade at 2026-01-14 3:00:01pm PST → Trading day 2026-01-15 (included)
    - Trade at 2026-01-15 3:00:00pm PST → Trading day 2026-01-15 (included)
    - Trade at 2026-01-15 3:00:01pm PST → Trading day 2026-01-16 (not included)
    
    Args:
        trading_day_str: ISO date string (YYYY-MM-DD)
        market_close_hour: Hour when market closes (15 = 3pm)
        timezone: Timezone string
    
    Returns:
        Tuple of (start_datetime, end_datetime) as naive datetime for database queries
    """
    pst = pytz.timezone(timezone)
    
    # Parse the trading day
    trading_date = datetime.strptime(trading_day_str, '%Y-%m-%d').date()
    
    # Trading day starts: previous day at market close + 1 microsecond
    # This ensures trades at exactly 3:00:00pm belong to previous trading day
    # Example: Trading day 2026-01-15 starts at 2026-01-14 3:00:00.000001pm PST
    start_date = trading_date - timedelta(days=1)
    start_dt = pst.localize(
        datetime.combine(start_date, datetime.min.time().replace(hour=market_close_hour, minute=0, second=0, microsecond=0))
    ) + timedelta(microseconds=1)  # Add 1 microsecond to exclude exactly 3:00:00.000000pm
    
    # Trading day ends: current day at market close (inclusive)
    # Example: Trading day 2026-01-15 ends at 2026-01-15 3:00:00pm PST (inclusive)
    end_dt = pst.localize(
        datetime.combine(trading_date, datetime.min.time().replace(hour=market_close_hour, minute=0, second=0))
    )
    
    # Convert to UTC then back to naive for database (if your DB stores naive datetimes)
    utc = pytz.UTC
    start_utc = start_dt.astimezone(utc)
    end_utc = end_dt.astimezone(utc)
    
    # Return as naive datetime (SQLAlchemy typically works with naive datetimes)
    return start_utc.replace(tzinfo=None), end_utc.replace(tzinfo=None)

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
            # Simple date filtering - use calendar date, not trading day
            if 'T' not in start_date:
                # It's a date string (YYYY-MM-DD), use it as calendar date
                start = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(Trade.exit_time >= start)
            else:
                # It's a full datetime, use as-is
                start = datetime.fromisoformat(start_date)
                query = query.filter(Trade.exit_time >= start)
        if end_date:
            # Simple date filtering - use calendar date, not trading day
            if 'T' not in end_date:
                # It's a date string (YYYY-MM-DD), use end of that day
                end = datetime.strptime(end_date, '%Y-%m-%d')
                end = end.replace(hour=23, minute=59, second=59)
                query = query.filter(Trade.exit_time <= end)
            else:
                # It's a full datetime, use as-is
                end = datetime.fromisoformat(end_date)
                query = query.filter(Trade.exit_time <= end)
        
        trades = query.all()

        daily_pnl = {}

        for trade in trades:
            # Use trading day (3pm PST cutoff) instead of calendar day
            trade_date = get_trading_day(trade.exit_time, market_close_hour=15, timezone='America/Los_Angeles')

            # Initialize date entry if not exists
            if trade_date not in daily_pnl:
                daily_pnl[trade_date] = {
                    'date': trade_date,
                    'pnl': 0.0,
                    'trade_count': 0,
                    'winning_trades': 0,
                    'losing_trades': 0,
                    'trades': []  # Include trades array for frontend
                }

            trade_pnl = float(trade.pnl)
            daily_pnl[trade_date]['pnl'] += trade_pnl
            daily_pnl[trade_date]['trade_count'] += 1
            daily_pnl[trade_date]['trades'].append(trade.to_dict())  # Add trade to array

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

@pnl_bp.route('/api/trades/calendar', methods=['GET'])
def get_calendar_trades():
    """
    Get trades grouped by date for calendar display.
    Only returns matched trades (from trades table).
    """
    from app.db.models import Trade
    from datetime import datetime
    
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    
    # Query trades (not orders)
    query = Trade.query
    
    if year and month:
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        # Filter by exit_time (trades are closed on exit date)
        query = query.filter(
            Trade.exit_time >= start_date,
            Trade.exit_time < end_date
        )
    
    trades = query.order_by(Trade.exit_time).all()
    
    # Group by trading day (3pm PST cutoff)
    daily_data = {}
    for trade in trades:
        date_str = get_trading_day(trade.exit_time, market_close_hour=15, timezone='America/Los_Angeles')
        
        if date_str not in daily_data:
            daily_data[date_str] = {
                'date': date_str,
                'pnl': 0.0,
                'trades': []
            }
        
        daily_data[date_str]['pnl'] += float(trade.pnl)
        daily_data[date_str]['trades'].append(trade.to_dict())
    
    return jsonify({
        'data': list(daily_data.values())
    })