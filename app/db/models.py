from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Trade(db.Model):
    __tablename__ = 'trades'
    __table_args__ = {'schema': 'trade'}

    id = db.Column(db.String(50), primary_key = True)
    acc_id = db.Column(db.String(20), nullable = False)
    symbol = db.Column(db.String(10), nullable = False)
    direction = db.Column(db.String(10), nullable = False)
    entry_time = db.Column(db.DateTime, nullable = False)
    exit_time = db.Column(db.DateTime, nullable = False)
    entry_price = db.Column(db.Numeric(10,2), nullable = False)
    exit_price = db.Column(db.Numeric(10,2), nullable = False)
    quantity = db.Column(db.Integer, nullable = False)
    pnl = db.Column(db.Numeric(10,2), nullable = False)
    strategy = db.Column(db.String(50), nullable = True)
    trade_type = db.Column(db.String(20), nullable = True)


    # convert trade object to dict
    def to_dict(self):
        return {
            'id': self.id,
            'acc_id': self.acc_id,
            'symbol': self.symbol,
            'direction': self.direction,
            'entry_time': self.entry_time.isoformat() if self.entry_time else None, 
            'exit_time': self.exit_time.isoformat() if self.exit_time else None,
            'entry_price': float(self.entry_price),
            'exit_price': float(self.exit_price),
            'quantity': int(self.quantity),
            'pnl': float(self.pnl),
            'strategy': self.strategy,
            'trade_type': self.trade_type
        }
