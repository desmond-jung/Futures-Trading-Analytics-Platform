from __future__ import annotations
from app.utils.contract_multipliers import get_contract_multiplier

import csv
import hashlib
import io
import uuid
from typing import Any, List, Dict, Optional
from datetime import datetime

def parse_csv_text(csv_text: str) -> List[Dict[str, str]]:
    """
    Parses csv text into list of dictionary where each row is a dict where key are columns
    """

    csv_file = io.StringIO(csv_text)

    reader = csv.DictReader(csv_file)
    
    rows = list(reader)

    return rows

def normalize_column_name(column_name: str) -> str:
    normalized = column_name.lower().replace(' ', '').replace('_', '')
    return normalized

def find_column_value(row: Dict[str, str], possible_names: List[str]) -> Optional[str]:
    """
    args:
        row: dict representing one csv row
        possible_namesL list of possible col names to try
    """
    # try exact match
    for name in possible_names:
        if name in row:
            return row[name].strip() if row[name] else None
        
        for key in row.keys():
            if key.lower() == name.lower():
                return row[key].strip() if row[key] else None

    # try normalized matches
    normalized_rows = {normalize_column_name(k): v for k, v in row.items()}
    for name in possible_names:
        normalized_name = normalize_column_name(name)
        if normalized_name in normalized_rows:
            value = normalized_rows[normalized_name]
            return value.strip() if value else None

    return None

def combine_date_time(date_str: str, time_str: Optional[str] = None) -> datetime:
    """convert date:2026-01-15, time: 09:30 to datetime(2026, 1, 15, 9, 30)"""

    date_obj = datetime.strptime(date_str, "%Y-%m-%d")

    if time_str:
        time_str = time_str.strip()
        if len(time_str) == 5:
            time_format = "%H:%M"
        else:
            time_format = "%H:%M:%S"

        time_obj = datetime.strptime(time_str, time_format).time()
        return datetime.combine(date_obj.date(), time_obj)
    
    return date_obj

def calculate_pnl(entry_price: float, exit_price: float, quantity: int, side: str, contract: str = None) -> float:
    """
    Calculate PnL for a trade.
    
    Args:
        entry_price: Entry price
        exit_price: Exit price
        quantity: Number of contracts
        side: 'long' or 'short'
        contract: Contract symbol (e.g., 'MGCG6') for multiplier lookup
    """
    from app.utils.contract_multipliers import get_contract_multiplier
    
    multiplier = get_contract_multiplier(contract) if contract else 1.0
    
    if side.lower() == 'long':
        return (exit_price - exit_price) * quantity * multiplier
    else:
        return (entry_price - exit_price) * quantity * multiplier

def map_csv_row_to_backend_format(row:Dict[str, str], default_acc_id: str = "default") -> Dict[str, Any]:
    """
    - Date + Time → entry_time, exit_time
    - Symbol → symbol
    - Side → direction (LONG/SHORT)
    - Entry Price → entry_price
    - Exit Price → exit_price
    - Quantity → quantity
    - PnL → pnl
    - Tags → strategy (first tag)
    - Account → acc_id
    - Notes → (not stored in backend currently, but we can add it later)
    - Duration → (not stored in backend currently)
    """

    trade_id = find_column_value(row, ['id', 'trade_id', 'tradeid'])
    if not trade_id:
        trade_id = f"csv-{uuid.uuid4().hex[:12]}"
    
    # symbol
    symbol = find_column_value(row, ['Symbol', 'symbol', 'sym', 'instrument'])
    if not symbol:
        raise ValueError("Missing required field: Symbol")
    
    # side - direction
    side = find_column_value(row, ['direction', 'side', 'Side', 'Direction', 'dir'])
    if not side:
        raise ValueError("Missing required field: side")

    # Convert to backend format (LONG/SHORT)
    direction = side.upper()
    if direction not in ['LONG', 'SHORT']:
        side_lower = side.lower()
        if side_lower in ['buy', 'b', 'long', 'l']:
            direction = 'LONG'
        elif side_lower in ['sell', 's', 'short', 'sh']:
            direction = 'SHORT'
        else:
            raise ValueError(f"Invalid Side value: {side}. Must be 'long' or 'short'")
    
    # Step 4: Get Entry Price and Exit Price
    entry_price_str = find_column_value(row, ['Entry Price', 'entry price', 'entry_price', 'entryprice', 'entry'])
    exit_price_str = find_column_value(row, ['Exit Price', 'exit price', 'exit_price', 'exitprice', 'exit'])
    
    if not entry_price_str:
        raise ValueError("Missing required field: Entry Price")
    if not exit_price_str:
        raise ValueError("Missing required field: Exit Price")

    try:
        entry_price = float(entry_price_str)
        exit_price = float(exit_price_str)
    except ValueError:
        raise ValueError(f"Invalid price values: entry={entry_price_str}, exit={exit_price_str}")
    
    # Step 5: Get Quantity
    quantity_str = find_column_value(row, ['Quantity', 'quantity', 'qty', 'shares', 'contracts'])
    if not quantity_str:
        raise ValueError("Missing required field: Quantity")
    
    try:
        quantity = int(float(quantity_str))
    except ValueError:
        raise ValueError(f"Invalid Quantity value: {quantity_str}")
    
    # Step 6: Get Date and Time
    date_str = find_column_value(row, ['Date', 'date', 'trade_date'])
    if not date_str:
        raise ValueError("Missing required field: Date")
    
    # Get Time (your CSV has a "Time" column)
    time_str = find_column_value(row, ['Time', 'time', 'trade_time'])
     # For entry_time and exit_time, we'll use the same date+time
    # (If you have separate entry/exit times in future, we can modify this)
    try:
        entry_time = combine_date_time(date_str, time_str)
        exit_time = combine_date_time(date_str, time_str)
        
        # If exit time is before entry time, assume next day (overnight trades)
        if exit_time < entry_time:
            from datetime import timedelta
            exit_time = exit_time + timedelta(days=1)
    except ValueError as e:
        raise ValueError(f"Invalid Date/Time format: {str(e)}")
    
    # Step 7: Get or Calculate PnL
    pnl_str = find_column_value(row, ['PnL', 'pnl', 'profit', 'pl', 'profit_loss'])
    if pnl_str:
        try:
            pnl = float(pnl_str)
        except ValueError:
            # If PnL is invalid, calculate it
            pnl = calculate_pnl(entry_price, exit_price, quantity, side)
    else:
        # Calculate PnL if not provided
        pnl = calculate_pnl(entry_price, exit_price, quantity, side)
    
    # Step 8: Get Account (maps to acc_id)
    acc_id = find_column_value(row, ['Account', 'account', 'acc_id', 'account_id'])
    if not acc_id:
        acc_id = default_acc_id

    # Step 9: Get Tags (maps to strategy - take first tag if multiple)
    tags_str = find_column_value(row, ['Tags', 'tags', 'tag', 'strategy'])
    strategy = None
    if tags_str:
        # If tags are semicolon-separated like "Breakout;Morning", take first one
        if ';' in tags_str:
            strategy = tags_str.split(';')[0].strip()
        else:
            strategy = tags_str.strip()
    
    # Step 10: Notes and Duration
    # These aren't in your backend model yet, but we can store them for future use
    notes = find_column_value(row, ['Notes', 'notes', 'note'])
    duration = find_column_value(row, ['Duration', 'duration'])
    
    # Build the backend format dictionary
    backend_trade = {
        'id': trade_id,
        'acc_id': acc_id,
        'symbol': symbol,
        'direction': direction,
        'entry_time': entry_time.isoformat(),  # Convert datetime to ISO string
        'exit_time': exit_time.isoformat(),
        'entry_price': entry_price,
        'exit_price': exit_price,
        'quantity': quantity,
        'pnl': pnl,
        'strategy': strategy,  # From Tags column
        'trade_type': None  # Will be auto-detected by backend
    }
    
    return backend_trade


def parse_and_validate_csv(csv_text: str, default_acc_id: str = "default") -> tuple[List[Dict[str, Any]], List[str]]:
    successful_trades = []
    error_messages = []

    try:
        rows = parse_csv_text(csv_text)

        if not rows:
            return [], ["CSV file is empty or has no data rows"]
        
        for row_num, row in enumerate(rows, start = 2):
            try:
                backend_trade = map_csv_row_to_backend_format(row, default_acc_id)
                successful_trades.append(backend_trade)
            except ValueError as e:
                # Record error but continue processing
                error_messages.append(f"Row {row_num}: {str(e)}")
            except Exception as e:
                error_messages.append(f"Row {row_num}: Unexpected error - {str(e)}")
    except Exception as e:
        error_messages.append(f"Failed to parse CSV: {str(e)}")
    
    return successful_trades, error_messages  
            
    
def save_raw_orders_to_db(csv_text: str, account: str = "default") -> tuple[List[Order], List[str]]:
    from app.db.models import Order, db
    from datetime import datetime

    rows = parse_csv_text(csv_text)

    if not rows:
        return [], ["CSV file is empty"]

    saved_orders = []
    errors = []

    def _stable_row_id(row: Dict[str, str]) -> str:
        """
        Orders.csv sometimes has non-unique orderId values due to scientific notation
        (e.g. 3.72955E+11). To make imports idempotent and avoid collisions, we use a
        deterministic hash of the row contents as the primary key.
        """
        # Sort keys for deterministic hashing
        normalized_items = []
        for k in sorted(row.keys()):
            v = row.get(k)
            normalized_items.append(f"{k}={'' if v is None else str(v).strip()}")
        payload = "|".join(normalized_items).encode("utf-8")
        return "ord-" + hashlib.sha1(payload).hexdigest()[:24]

    def _parse_datetime_maybe(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        s = str(value).strip()
        if not s or s.lower() in ['none', 'null', '']:
            return None
        
        # Try a few known formats from your Orders.csv
        # Format examples: "01/15/2026 07:40:22", "1/15/26 7:40"
        fmts = [
            "%m/%d/%Y %H:%M:%S",  # 01/15/2026 07:40:22
            "%m/%d/%y %H:%M:%S",  # 1/15/26 7:40:22
            "%m/%d/%Y %H:%M",     # 01/15/2026 07:40
            "%m/%d/%y %H:%M",     # 1/15/26 7:40
            "%Y-%m-%d %H:%M:%S",  # ISO format
            "%Y-%m-%d %H:%M",     # ISO format without seconds
        ]
        for fmt in fmts:
            try:
                return datetime.strptime(s, fmt)
            except ValueError:
                continue
        # Fall back: ISO-ish
        try:
            return datetime.fromisoformat(s.replace('Z', '+00:00'))
        except Exception:
            import sys
            print(f"⚠️  DEBUG: Could not parse datetime: '{s}'", file=sys.stderr)
            return None

    for row_num, row in enumerate(rows, start = 2):
        try:
            raw_order_id = row.get("orderId") or row.get("Order ID") or row.get("order_id")
            raw_order_id = str(raw_order_id).strip() if raw_order_id is not None else None

            # Primary key for our DB row (stable per unique row)
            order_row_id = _stable_row_id(row)
            
            # Parse fill time - try multiple column name variations (needed before checking existing)
            fill_time_str = (
                row.get("Fill Time") or 
                row.get("fill_time") or 
                row.get("FillTime") or
                row.get("fillTime") or
                row.get("Timestamp") or
                row.get("timestamp")
            )
            fill_time = _parse_datetime_maybe(fill_time_str)
            
            # Determine status flags (needed before checking existing)
            status = row.get('Status', '').strip()
            is_filled = status == 'Filled'
            
            # Check if order already exists (idempotency)
            existing = Order.query.filter_by(id=order_row_id).first()
            if existing:
                # Update fill_time if it's missing but we have it now
                updated = False
                if not existing.fill_time and fill_time:
                    existing.fill_time = fill_time
                    updated = True
                # Also update is_filled if status changed
                if existing.status != status:
                    existing.status = status
                    existing.is_filled = is_filled
                    updated = True
                if updated:
                    db.session.add(existing)
                    import sys
                    print(f"🔄 DEBUG: Updated existing order {order_row_id[:20]}... (fill_time={fill_time is not None}, status={status})", file=sys.stderr)
                errors.append(f"Row {row_num}: Order row already exists, skipping")
                continue
            
            # Debug: log if fill_time is missing for filled orders
            if is_filled and not fill_time:
                import sys
                print(f"⚠️  DEBUG: Row {row_num}: Filled order but no fill_time. Status={status}", file=sys.stderr)
                print(f"⚠️  DEBUG: Fill Time column value: '{fill_time_str}'", file=sys.stderr)
                # Show all columns that might contain time info
                time_columns = [k for k in row.keys() if 'time' in k.lower() or 'date' in k.lower() or 'timestamp' in k.lower()]
                print(f"⚠️  DEBUG: Time-related columns found: {time_columns}", file=sys.stderr)
            
            b_s = row.get('B/S', '').strip()
            is_buy = b_s.upper() == 'BUY'
            is_sell = b_s.upper() == 'SELL'

            def safe_float(value):
                if not value:
                    return None
                try:
                    return float(str(value).replace(',', ''))
                except:
                    return None
            
            def safe_int(value):
                if not value:
                    return None
                try:
                    return int(float(str(value).replace(',', '')))
                except:
                    return None
            
            avg_price = safe_float(row.get('Avg Fill Price') or row.get('avgPrice'))
            filled_qty = safe_int(row.get('Filled Qty') or row.get('filledQty'))
            limit_price = safe_float(row.get('Limit Price') or row.get('decimalLimit'))
            stop_price = safe_float(row.get('Stop Price') or row.get('decimalStop'))
            
            # Create Order object
            order = Order(
                id=order_row_id,
                order_id=raw_order_id,
                account=row.get('Account', account),
                b_s=b_s,
                contract=row.get('Contract', ''),
                product=row.get('Product', ''),
                avg_price=avg_price,
                filled_qty=filled_qty,
                fill_time=fill_time,
                status=status,
                limit_price=limit_price,
                stop_price=stop_price,
                order_type=row.get('Type', ''),
                text=row.get('Text', ''),
                raw_csv_data=row,  # Store entire row as JSON
                is_filled=is_filled,
                is_buy=is_buy,
                is_sell=is_sell
            )
            
            db.session.add(order)
            saved_orders.append(order)
        except Exception as e:
            errors.append(f"Row {row_num}: Error saving order - {str(e)}")
            continue
    
    # Commit all orders in one transaction
    try:
        db.session.commit()
        return saved_orders, errors
    except Exception as e:
        db.session.rollback()
        return [], [f"Database error: {str(e)}"] + errors


def process_filled_orders_to_trades(account: str = None) -> Dict[str, Any]:
    """
    Position-based matching: Process filled orders into trades.
    
    Logic:
    - A trade starts when net position goes from 0 → non-zero
    - A trade ends when net position returns to 0
    - All orders within a trade are stored in the 'fills' JSON array
    
    Note: This function must be called within app.app_context()
    
    Returns:
        dict with:
        - filled_orders_count: number of filled orders found
        - trades_created: number of trades created
        - errors: list of error messages
    """
    import sys
    from app.db.models import Order, Trade, db
    import uuid
    from decimal import Decimal
    
    print(f"\n🔄 DEBUG [process_filled_orders_to_trades]: Starting matching...", file=sys.stderr)
    print(f"🔄 DEBUG: Account filter = {account}", file=sys.stderr)
    
    errors = []
    trades_created = 0
    trades_matched = 0  # Count of existing trades that orders were matched to
    
    # Get all filled orders, sorted by fill_time
    query = Order.query.filter_by(is_filled=True).filter(Order.fill_time.isnot(None))
    if account and account != "default":
        # Only filter by account if it's not "default" (which might not match actual account names)
        query = query.filter_by(account=account)
        print(f"🔄 DEBUG: Filtering by account = {account}", file=sys.stderr)
    else:
        print(f"🔄 DEBUG: Not filtering by account (account={account}), getting all filled orders", file=sys.stderr)
    
    all_orders = query.order_by(Order.fill_time).all()
    filled_count = len(all_orders)
    
    print(f"🔄 DEBUG: Found {filled_count} filled orders", file=sys.stderr)
    
    if filled_count == 0:
        # Check total orders to see if any exist
        total_orders = Order.query.count()
        filled_orders_no_time = Order.query.filter_by(is_filled=True).count()
        print(f"🔄 DEBUG: Total orders in DB: {total_orders}", file=sys.stderr)
        print(f"🔄 DEBUG: Filled orders (any): {filled_orders_no_time}", file=sys.stderr)
        print(f"🔄 DEBUG: Filled orders with fill_time: {filled_count}", file=sys.stderr)
        
        return {
            'filled_orders_count': 0,
            'trades_created': 0,
            'errors': [f'No filled orders found (total orders: {total_orders}, filled: {filled_orders_no_time})']
        }
    
    # Group orders by (account, contract) - each group processed independently
    orders_by_key: Dict[tuple, List[Order]] = {}
    for order in all_orders:
        key = (order.account, order.contract)
        if key not in orders_by_key:
            orders_by_key[key] = []
        orders_by_key[key].append(order)
    
    print(f"🔄 DEBUG: Grouped into {len(orders_by_key)} (account, contract) groups", file=sys.stderr)
    for key, orders_list in orders_by_key.items():
        print(f"  - {key[0]}/{key[1]}: {len(orders_list)} orders", file=sys.stderr)
    
    # Process each (account, contract) group
    for (acc, contract), orders in orders_by_key.items():
        print(f"\n🔄 DEBUG: Processing {contract} (account: {acc}), {len(orders)} orders", file=sys.stderr)
        # Sort by fill_time within this group
        orders.sort(key=lambda o: o.fill_time)
        
        # Track position and current trade
        net_position = 0  # Current position (positive = long, negative = short)
        current_trade_orders: List[Order] = []  # Orders in current trade
        
        # Helper function to close current trade
        def close_current_trade():
            nonlocal trades_created, trades_matched, current_trade_orders
            if len(current_trade_orders) > 0:
                try:
                    # Check if trade already exists before creating
                    trade = _create_trade_from_orders(current_trade_orders, acc, contract)
                    if trade:
                        # Check if trade with this ID already exists (idempotency)
                        existing_trade = Trade.query.filter_by(id=trade.id).first()
                        if existing_trade:
                            # Trade already exists - just mark orders as matched to existing trade
                            print(f"🔄 DEBUG: Trade {trade.id[:20]}... already exists, skipping creation", file=sys.stderr)
                            
                            # Recalculate PnL for existing trade using multiplier (in case it was created before multiplier was added)
                            from app.utils.contract_multipliers import get_contract_multiplier
                            multiplier = get_contract_multiplier(existing_trade.symbol)
                            old_pnl = float(existing_trade.pnl)
                            
                            # Recalculate PnL with multiplier
                            if existing_trade.direction == 'LONG':
                                new_pnl = (float(existing_trade.exit_price) - float(existing_trade.entry_price)) * existing_trade.quantity * multiplier
                            else:  # SHORT
                                new_pnl = (float(existing_trade.entry_price) - float(existing_trade.exit_price)) * existing_trade.quantity * multiplier
                            
                            # Only update if PnL changed significantly (more than 1% difference)
                            if abs(new_pnl - old_pnl) > abs(old_pnl * 0.01):
                                print(f"💰 DEBUG: Recalculating PnL for existing trade {existing_trade.id[:20]}...", file=sys.stderr)
                                print(f"  - Old PnL: {old_pnl}, New PnL: {new_pnl} (multiplier: {multiplier})", file=sys.stderr)
                                existing_trade.pnl = new_pnl
                            
                            trades_matched += 1
                            for o in current_trade_orders:
                                if not o.is_matched:  # Only update if not already matched
                                    o.is_matched = True
                                    o.matched_trade_id = existing_trade.id
                        else:
                            # New trade - create it
                            db.session.add(trade)
                            trades_created += 1
                            # Mark orders as matched
                            for o in current_trade_orders:
                                o.is_matched = True
                                o.matched_trade_id = trade.id
                except Exception as e:
                    errors.append(f"Error creating trade from orders: {str(e)}")
                current_trade_orders = []
        
        for order in orders:
            # Calculate position change
            if order.is_buy:
                position_change = order.filled_qty
            elif order.is_sell:
                position_change = -order.filled_qty
            else:
                errors.append(f"Order {order.id}: Unknown direction (not buy or sell)")
                continue
            
            # Store previous position and sign
            prev_position = net_position
            prev_position_sign = 1 if prev_position > 0 else (-1 if prev_position < 0 else 0)
            
            # Calculate new position after this order
            new_position = net_position + position_change
            
            # Check if position crosses zero (goes from + to - or - to +, but not through 0)
            # Example: +5 to -2 means we closed the long and opened a short
            position_crossed_zero = (prev_position_sign != 0 and 
                                    new_position != 0 and 
                                    ((prev_position_sign > 0) != (new_position > 0)))
            
            if position_crossed_zero:
                # Position crossed zero: close current trade, start new trade with this order
                close_current_trade()
                # Start new trade with this order
                current_trade_orders = [order]
                net_position = new_position
            elif prev_position == 0:
                # Starting new trade from zero
                current_trade_orders = [order]
                net_position = new_position
                # Check if this order immediately closes the trade (position still 0)
                if net_position == 0:
                    close_current_trade()
            else:
                # Continue current trade
                current_trade_orders.append(order)
                net_position = new_position
                # Check if trade is complete (position returns to exactly 0)
                if net_position == 0:
                    close_current_trade()
        
        # Check for open position at end (position != 0)
        if net_position != 0:
            error_msg = (
                f"Open position remaining for {contract} (account: {acc}): "
                f"position={net_position}, {len(current_trade_orders)} orders unmatched"
            )
            errors.append(error_msg)
            print(f"⚠️  DEBUG: {error_msg}", file=sys.stderr)
    
    print(f"\n🔄 DEBUG: Matching complete:", file=sys.stderr)
    print(f"  - Trades created: {trades_created}", file=sys.stderr)
    print(f"  - Trades matched (existing): {trades_matched}", file=sys.stderr)
    print(f"  - Errors: {len(errors)}", file=sys.stderr)
    
    # Commit all trades
    try:
        db.session.commit()
        print(f"✅ DEBUG: Committed {trades_created} trades to database", file=sys.stderr)
    except Exception as e:
        db.session.rollback()
        error_msg = f"Database error committing trades: {str(e)}"
        errors.append(error_msg)
        print(f"❌ DEBUG: {error_msg}", file=sys.stderr)
    
    return {
        'filled_orders_count': filled_count,
        'trades_created': trades_created,
        'trades_matched': trades_matched,  # Existing trades that orders were matched to
        'errors': errors
    }


def _create_trade_from_orders(orders: List[Order], account: str, contract: str) -> Optional[Trade]:
    """
    Helper: Create a Trade object from a list of orders.
    
    Args:
        orders: List of Order objects that form one complete trade
        account: Account ID
        contract: Contract symbol (e.g., 'MGCG6')
    
    Returns:
        Trade object or None if error
    """
    from app.db.models import Trade
    from decimal import Decimal
    import uuid
    
    if not orders or len(orders) == 0:
        return None
    
    # Sort orders by fill_time
    orders.sort(key=lambda o: o.fill_time)
    
    # Determine direction: first order determines direction
    first_order = orders[0]
    if first_order.is_buy:
        direction = 'LONG'
    elif first_order.is_sell:
        direction = 'SHORT'
    else:
        return None  # Unknown direction
    
    # Calculate entry and exit
    entry_orders = []
    exit_orders = []
    entry_qty = 0
    exit_qty = 0
    entry_value = Decimal('0')
    exit_value = Decimal('0')
    
    for order in orders:
        order_dict = order.to_dict()
        if direction == 'LONG':
            if order.is_buy:
                entry_orders.append(order_dict)
                entry_qty += order.filled_qty
                entry_value += Decimal(str(order.avg_price)) * Decimal(str(order.filled_qty))
            else:  # is_sell
                exit_orders.append(order_dict)
                exit_qty += order.filled_qty
                exit_value += Decimal(str(order.avg_price)) * Decimal(str(order.filled_qty))
        else:  # SHORT
            if order.is_sell:
                entry_orders.append(order_dict)
                entry_qty += order.filled_qty
                entry_value += Decimal(str(order.avg_price)) * Decimal(str(order.filled_qty))
            else:  # is_buy
                exit_orders.append(order_dict)
                exit_qty += order.filled_qty
                exit_value += Decimal(str(order.avg_price)) * Decimal(str(order.filled_qty))
    
    # Calculate average prices
    if entry_qty > 0:
        entry_price = float(entry_value / Decimal(str(entry_qty)))
    else:
        return None
    
    if exit_qty > 0:
        exit_price = float(exit_value / Decimal(str(exit_qty)))
    else:
        return None
    
    # Entry and exit times
    entry_time = orders[0].fill_time
    exit_time = orders[-1].fill_time
    
    # Get contract multiplier (dollar value per point)
    multiplier = get_contract_multiplier(contract)

    if direction == 'LONG':
        pnl = (exit_price - entry_price) * entry_qty * multiplier
    else:  # SHORT
        pnl = (entry_price - exit_price) * entry_qty * multiplier
    
    # Create fills array: all orders as dicts
    fills = [order.to_dict() for order in orders]

    # Generate deterministic trade ID based on order IDs (for idempotency)
    # Sort order IDs to ensure same set of orders always produces same trade ID
    # This ensures re-importing the same CSV won't create duplicate trades
    order_ids = sorted([order.id for order in orders])
    order_ids_str = "|".join(order_ids)
    trade_id_hash = hashlib.sha1(order_ids_str.encode('utf-8')).hexdigest()[:16]
    trade_id = f"trade_{trade_id_hash}"
    
    # Detect trade type (day trade vs swing)
    from app.services.metrics import detect_trade_type
    trade_type = detect_trade_type(entry_time, exit_time)
    
    # Create trade
    trade = Trade(
        id=trade_id,
        acc_id=account,
        symbol=contract,
        direction=direction,
        entry_time=entry_time,
        exit_time=exit_time,
        entry_price=Decimal(str(entry_price)),
        exit_price=Decimal(str(exit_price)),
        quantity=entry_qty,
        pnl=Decimal(str(pnl)),
        trade_type=trade_type,  # day_trade, swing, etc.
        fills=fills,  # Store all orders as JSON array
        is_scaled=len(exit_orders) > 1  # Multiple exit orders = scaled exit
    )
    
    return trade

if __name__ == '__main__':
    with open('/Users/desmondjung/Downloads/Orders.csv', 'r') as f:
        csv_text = f.read()
    
    trades, errors = parse_and_validate_csv(csv_text, default_acc_id = "default")
    print(f"Successfully parsed: {len(trades)} trades")
    print(f"Errors: {errors}")