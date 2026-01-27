from flask import Flask, request, jsonify
from app.db.models import db
from app.api.trades import trade_bp
from app.api.pnl import pnl_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# database configs
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://desmondjung@localhost/trading_journal'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'connect_args': {'options': '-csearch_path=trade'}
}

db.init_app(app)

# register blueprints
app.register_blueprint(trade_bp)
app.register_blueprint(pnl_bp)

@app.route('/')
def home():
    return jsonify({
        'message': 'Trading Journal API', 
        'endpoints': [
            'POST /api/trades',
            'GET /api/trades',
            'GET /api/pnl/daily'
            ]
        })

if __name__ == '__main__':
    # create tables
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5001)