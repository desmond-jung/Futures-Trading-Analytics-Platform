# Connecting to Your Python Backend

This guide explains how to replace the mock data in this trading dashboard with real data from your Python API backend.

## Overview

Currently, the dashboard uses mock data generated in the frontend. To connect it to your Python backend, you'll need to replace the mock data functions with API calls.

## Key Files to Modify

### 1. `/App.tsx` - Main Application File

**Current Mock Data Generation:**
```typescript
const generateMockData = (year: number, month: number): DailyPnL[] => {
  // ... mock data generation
}
```

**Replace with API Call:**
```typescript
const fetchTradeData = async (year: number, month: number): Promise<DailyPnL[]> => {
  try {
    const response = await fetch(`https://your-python-api.com/api/trades?year=${year}&month=${month}`, {
      headers: {
        'Authorization': `Bearer ${YOUR_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch trades');
    
    const data = await response.json();
    return data.trades; // Assuming your API returns { trades: DailyPnL[] }
  } catch (error) {
    console.error('Error fetching trade data:', error);
    return [];
  }
};
```

**Update the state initialization:**
```typescript
// Change from:
const [tradeData, setTradeData] = useState<DailyPnL[]>(generateMockData(2026, 1));

// To:
const [tradeData, setTradeData] = useState<DailyPnL[]>([]);

// Add useEffect to fetch on mount:
useEffect(() => {
  const loadData = async () => {
    const data = await fetchTradeData(currentYear, currentMonth);
    setTradeData(data);
  };
  loadData();
}, [currentYear, currentMonth]);
```

## API Endpoints You Need in Your Python Backend

### 1. **GET /api/trades** - Fetch trades for a specific month
```python
# Flask example
@app.route('/api/trades', methods=['GET'])
def get_trades():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    
    # Your logic to fetch trades from database
    trades = fetch_trades_from_db(year, month)
    
    # Group by date and return in the expected format
    daily_data = group_trades_by_date(trades)
    
    return jsonify({'trades': daily_data})
```

**Expected Response Format:**
```json
{
  "trades": [
    {
      "date": "2026-01-15",
      "pnl": 450.00,
      "trades": [
        {
          "id": "trade-123",
          "date": "2026-01-15",
          "symbol": "AAPL",
          "side": "long",
          "entryPrice": 150.50,
          "exitPrice": 155.00,
          "quantity": 100,
          "pnl": 450.00,
          "riskReward": 2.5,
          "tags": ["Breakout", "Morning"],
          "notes": "Good setup",
          "time": "09:30",
          "screenshots": ["https://..."]
        }
      ]
    }
  ]
}
```

### 2. **POST /api/trades** - Add a new trade
```python
@app.route('/api/trades', methods=['POST'])
def create_trade():
    trade_data = request.json
    
    # Validate and save to database
    new_trade = save_trade_to_db(trade_data)
    
    return jsonify({'trade': new_trade}), 201
```

**Request Body Format:**
```json
{
  "date": "2026-01-15",
  "symbol": "AAPL",
  "side": "long",
  "entryPrice": 150.50,
  "exitPrice": 155.00,
  "quantity": 100,
  "tags": ["Breakout"],
  "notes": "Good setup",
  "time": "09:30"
}
```

### 3. **PUT /api/trades/:id** - Update a trade
```python
@app.route('/api/trades/<trade_id>', methods=['PUT'])
def update_trade(trade_id):
    trade_data = request.json
    
    # Update in database
    updated_trade = update_trade_in_db(trade_id, trade_data)
    
    return jsonify({'trade': updated_trade})
```

### 4. **DELETE /api/trades/:id** - Delete a trade
```python
@app.route('/api/trades/<trade_id>', methods=['DELETE'])
def delete_trade(trade_id):
    # Delete from database
    delete_trade_from_db(trade_id)
    
    return '', 204
```

### 5. **POST /api/trades/import** - Import trades from CSV
```python
@app.route('/api/trades/import', methods=['POST'])
def import_trades():
    csv_data = request.json.get('csv_data')
    
    # Parse CSV and save trades
    trades = parse_and_save_csv(csv_data)
    
    return jsonify({'imported': len(trades), 'trades': trades})
```

## Frontend Changes for Each Feature

### Adding a Trade (handleAddTrade in TradeDetailModal.tsx)

**Current Code:**
```typescript
const updatedTrades = [...trades, trade];
setTrades(updatedTrades);
onUpdateTrades(updatedTrades);
```

**Replace with:**
```typescript
// POST to your API
const response = await fetch('https://your-python-api.com/api/trades', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${YOUR_API_TOKEN}`
  },
  body: JSON.stringify(trade)
});

if (response.ok) {
  const newTrade = await response.json();
  const updatedTrades = [...trades, newTrade.trade];
  setTrades(updatedTrades);
  onUpdateTrades(updatedTrades);
}
```

### Updating a Trade (handleUpdateTrade in TradeDetailModal.tsx)

**Replace with:**
```typescript
const response = await fetch(`https://your-python-api.com/api/trades/${tradeId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${YOUR_API_TOKEN}`
  },
  body: JSON.stringify(updates)
});

if (response.ok) {
  const updatedTrade = await response.json();
  const updatedTrades = trades.map(t => t.id === tradeId ? updatedTrade.trade : t);
  setTrades(updatedTrades);
  onUpdateTrades(updatedTrades);
}
```

### Deleting a Trade (handleDeleteTrade in TradeDetailModal.tsx)

**Replace with:**
```typescript
const response = await fetch(`https://your-python-api.com/api/trades/${tradeId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${YOUR_API_TOKEN}`
  }
});

if (response.ok) {
  const updatedTrades = trades.filter(trade => trade.id !== tradeId);
  setTrades(updatedTrades);
  onUpdateTrades(updatedTrades);
}
```

### Importing Trades (handleCsvImport in ImportModal.tsx)

**Replace with:**
```typescript
const response = await fetch('https://your-python-api.com/api/trades/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${YOUR_API_TOKEN}`
  },
  body: JSON.stringify({ csv_data: csvData })
});

if (response.ok) {
  const result = await response.json();
  onImport(result.trades);
}
```

## Environment Variables

Create a `.env` file in your project root:

```
VITE_API_URL=https://your-python-api.com
VITE_API_TOKEN=your_api_token_here
```

Access in your code:
```typescript
const API_URL = import.meta.env.VITE_API_URL;
const API_TOKEN = import.meta.env.VITE_API_TOKEN;
```

## CORS Configuration (Python Backend)

Make sure your Python backend allows CORS from your frontend domain:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://your-frontend-domain.com"])
```

## Authentication

If you need user authentication:

1. Implement a login endpoint in Python
2. Store JWT token in localStorage
3. Include token in all API requests

```typescript
// Login
const login = async (username: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
};

// Use token in requests
const token = localStorage.getItem('token');
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Summary

1. **Replace mock data with API calls** in App.tsx
2. **Add fetch calls** to all CRUD operations (create, update, delete)
3. **Set up environment variables** for API URL and token
4. **Ensure your Python backend** returns data in the expected format
5. **Handle errors** appropriately with try/catch blocks
6. **Add loading states** while fetching data

The mock data structure is already designed to match what you'd get from a real API, so you mainly need to replace the generation functions with fetch calls!
