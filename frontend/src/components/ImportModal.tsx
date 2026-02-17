import { useState, ChangeEvent } from 'react';
import { X, Upload, Code } from 'lucide-react';

const API_URL = 'http://localhost:5001';

interface ImportModalProps {
  onClose: () => void;
  onImport: () => void;
  theme: 'light' | 'dark';
}

export function ImportModal({ onClose, onImport, theme }: ImportModalProps) {
  const [importMethod, setImportMethod] = useState<'csv' | 'api'>('csv');
  const [csvData, setCsvData] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCsvImport = async () => {
    // Validate CSV data exists
    if (!csvData.trim()) {
      setErrorMessage('Please provide CSV data');
      return;
    }

    // Show loading state
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Send CSV to backend API
      const response = await fetch(`${API_URL}/api/trades/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csv_text: csvData,
          default_acc_id: 'default'
        }),
      });

      // Parse response
      const data = await response.json();

      // Check if request failed
      if (!response.ok) {
        const errorMsg = data.error || `Failed to import trades: ${response.statusText}`;
        setErrorMessage(errorMsg);
        if (data.errors && Array.isArray(data.errors)) {
          console.error('Import errors:', data.errors);
        }
        return;
      }

      // Show success message
      // Backend returns 'trades_created' not 'imported_count'
      const tradesCreated = data.trades_created || 0;
      const tradesMatched = data.trades_matched || 0;  // Existing trades that orders were matched to
      const ordersSaved = data.orders_saved || 0;
      
      // Check if trades were created OR matched OR orders were saved
      if (tradesCreated === 0 && tradesMatched === 0 && ordersSaved === 0) {
        setErrorMessage('No trades were imported. Check your CSV format.');
        return;
      }

      // Show appropriate message based on what happened
      let successMessage = '';
      if (tradesCreated > 0) {
        successMessage = `Successfully imported ${tradesCreated} new trade${tradesCreated > 1 ? 's' : ''}!`;
        if (ordersSaved > 0) {
          successMessage += ` (${ordersSaved} orders saved)`;
        }
      } else if (tradesMatched > 0) {
        // Orders were matched to existing trades (idempotent re-import)
        successMessage = `Orders matched to ${tradesMatched} existing trade${tradesMatched > 1 ? 's' : ''}.`;
        if (ordersSaved > 0) {
          successMessage += ` (${ordersSaved} orders saved)`;
        }
      } else if (ordersSaved > 0) {
        successMessage = `Saved ${ordersSaved} orders, but no trades were created. ${data.warning || 'Check if orders are filled.'}`;
      }
      
      if (successMessage) {
        alert(successMessage);
      }

      // Call onImport to trigger data refresh in parent
      onImport();
      onClose(); // Close the modal
    } catch (error) {
      // Handle network errors or other exceptions
      console.error('Error importing CSV:', error);
      setErrorMessage(`Failed to connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure your Flask server is running on ${API_URL}`);
    } finally {
      // Always hide loading state
      setIsLoading(false);
    }
  };

  const handleApiImport = async () => {
    try {
      // This is a placeholder for actual API integration
      // In production, you would make an actual API call to your Python backend
      alert('API Import functionality will connect to your Python backend. Replace this with actual API call.');
      
      // Example of what the API call would look like:
      // const response = await fetch(apiEndpoint, {
      //   headers: {
      //     'Authorization': `Bearer ${apiKey}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      // const data = await response.json();
      // onImport(data.trades);
      
      onClose();
    } catch (error) {
      alert('Error importing from API: ' + error);
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
      };
      reader.readAsText(file);
    }
  };

  const exampleCsv = `date,symbol,side,entry_price,exit_price,quantity,pnl,tags,notes,time
2026-01-15,AAPL,long,150.50,155.00,100,450.00,Breakout;Morning,Good setup,09:30
2026-01-15,TSLA,short,250.00,245.00,50,250.00,Scalp,Quick trade,10:15`;

  const bgClass = theme === 'dark' ? 'bg-[#161B22]' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600';
  const borderClass = theme === 'dark' ? 'border-[#2A2F3A]' : 'border-gray-200';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`${bgClass} rounded-xl shadow-2xl w-full max-w-3xl`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold">Import Trades</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Import Method Selection */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setImportMethod('csv')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                importMethod === 'csv'
                  ? 'bg-blue-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              CSV File
            </button>
            <button
              onClick={() => setImportMethod('api')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                importMethod === 'api'
                  ? 'bg-blue-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Code className="w-5 h-5 inline mr-2" />
              Broker API
            </button>
          </div>

          {/* CSV Import */}
          {importMethod === 'csv' && (
            <div>
              <div className="mb-4">
                <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className={`w-full px-3 py-2 border ${borderClass} rounded ${
                    theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'
                  }`}
                />
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>
                  Or Paste CSV Data
                </label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder={exampleCsv}
                  className={`w-full px-3 py-2 border ${borderClass} rounded font-mono text-sm ${
                    theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'
                  }`}
                  rows={10}
                />
              </div>

              <div className={`p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-blue-50'} rounded-lg mb-4`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-blue-800'} font-medium mb-2`}>
                  CSV Format Requirements:
                </p>
                <ul className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-blue-700'} space-y-1 list-disc list-inside`}>
                  <li>First row must be headers</li>
                  <li>Required columns: date, symbol, side, entry_price, exit_price, quantity</li>
                  <li>Optional columns: pnl, tags (semicolon-separated), notes, time</li>
                  <li>Date format: YYYY-MM-DD</li>
                  <li>Side: "long" or "short"</li>
                </ul>
              </div>

              {errorMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-red-900 bg-opacity-30 text-red-300' : 'bg-red-50 text-red-700'
                }`}>
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}

              <button
                onClick={handleCsvImport}
                disabled={!csvData || isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Importing...' : 'Import from CSV'}
              </button>
            </div>
          )}

          {/* API Import */}
          {importMethod === 'api' && (
            <div>
              <div className="mb-4">
                <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>
                  API Endpoint
                </label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://your-python-backend.com/api/trades"
                  className={`w-full px-3 py-2 border ${borderClass} rounded ${
                    theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'
                  }`}
                />
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>
                  API Key (Optional)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Your API key or authentication token"
                  className={`w-full px-3 py-2 border ${borderClass} rounded ${
                    theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'
                  }`}
                />
              </div>

              <div className={`p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-yellow-50'} rounded-lg mb-4`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-yellow-800'} font-medium mb-2`}>
                  🔗 Connect to Your Python Backend
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-yellow-700'} mb-2`}>
                  This will connect to your Python API endpoint. Make sure your backend returns trade data in the following format:
                </p>
                <pre className={`text-xs ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-800'} p-2 rounded overflow-x-auto`}>
{`{
  "trades": [
    {
      "date": "2026-01-15",
      "symbol": "AAPL",
      "side": "long",
      "entryPrice": 150.50,
      "exitPrice": 155.00,
      "quantity": 100,
      "pnl": 450.00,
      "tags": ["Breakout"],
      "notes": "Good setup",
      "time": "09:30"
    }
  ]
}`}
                </pre>
              </div>

              <button
                onClick={handleApiImport}
                disabled={!apiEndpoint}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect & Import from API
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
