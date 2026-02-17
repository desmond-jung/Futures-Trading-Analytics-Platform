""" 
Transforms tradovate data into Order and Trade model cooming from tradovate.py in ingestion
"""
from datetime import datetime
from typing import List, Dict, Tuple

from app.db.models import db, Order


#process_filled_orders_to_trades(account=account) use this 

def save_tradovate_fills_to_db(fills, account = "default"):
    # 1. Loop through Tradovate fills
    # 2. Transform each fill → Order model
    # 3. Save to database

    """ 
    example fill:
    {
    "id": 375750491252,
    "orderId": 375750491249,
    "contractId": 4214197,
    "timestamp": "2026-02-17T08:39:53.889Z",
    "tradeDate": {
      "year": 2026,
      "month": 2,
      "day": 17
    },
    "action": "Sell",
    "qty": 1,
    "price": 24652.0,
    "active": true,
    "finallyPaired": 0,
    "external": false
  }
    """
    """
    order shcema
    id': self.id,
    'order_id': self.order_id,
    'account': self.account,
    'b_s': self.b_s,
    'contract': self.contract,
    'avg_price': float(self.avg_price) if self.avg_price else None,
    'filled_qty': self.filled_qty,
    'fill_time': self.fill_time.isoformat() if self.fill_time else None,
    'status': self.status,
    'is_filled': self.is_filled,
    'is_buy': self.is_buy,
    'is_sell': self.is_sell,
    'is_matched': self.is_matched

    each tradovate fill is one order row
    pk is fill-<fill_id>
    order id is order id
    """

    saved_orders: List[Order] = []
    errors: List[Order] = []


    if not fills:
       return saved_orders, errors

    def _parse_timestamp(ts: str) -> datetime | None:
        if not ts:
            return None
        try:
            # Example: "2026-02-17T08:39:53.889Z"
            # Remove trailing 'Z' if present
            if ts.endswith("Z"):
                ts = ts[:-1]
            # Try with microseconds first, then without
            try:
                return datetime.fromisoformat(ts)
            except ValueError:
                # Fallback if there are no fractional seconds
                return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%S")
        except Exception:
            return None

    for idx, fill in enumerate(fills, start=1):
        try:
            fill_id = fill.get("id")
            if fill_id is None:
                error.append(f"Fill at index {idx}: missing 'id")
                continue
            order_pk = f"fill-{fill_id}"
            
            existing = Order.query.get(order_pk)
            order_id = str(fill.get("orderId")) if fill.get("orderId") is not None else None
            action = fill.get("action", "").capitalize()
            qty = fill.get("qty")
            price = fill.get("price")
            timestamp = fill.get("timestamp")

            account_id = str(fill.get("accountId")) if fill.get("accountId") is not None else account

            # basic validations
            if action not in ("Buy", "Sell"):
                errors.append(f"Fill {fill_id}: invalid action '{action}'")
                continue

            fill_time = _parse_timestamp(timestamp)

            is_buy = action == "Buy"
            is_sell = action == "Sell"

            # create or update Order instance
            if existing:
                order = existing
            else:
                order = Order(id=order_id)

            order.order_id = order_id
            order.account = account_id
            order.b_s = action  # "Buy" or "Sell"
            # For now we don't know symbol/product; you can enhance this later with contract lookup
            order.contract = None
            order.product = None
            order.avg_price = price
            order.filled_qty = qty
            order.fill_time = fill_time
            order.status = "Filled"
            order.limit_price = None
            order.stop_price = None
            order.order_type = None
            order.text = "Tradovate import"
            order.raw_csv_data = fill  # store full fill dict for debugging
            order.is_filled = True
            order.is_buy = is_buy
            order.is_sell = is_sell

            if not existing:
                db.session.add(order)
                saved_orders.append(order)
            else:
                # Existing order updated in-place; still count it as "saved"
                saved_orders.append(order)

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            errors.insert(0, f"Database error committing Tradovate fills: {str(e)}")
            # If commit fails, nothing was actually saved
            return [], errors

        return saved_orders, errors
    
