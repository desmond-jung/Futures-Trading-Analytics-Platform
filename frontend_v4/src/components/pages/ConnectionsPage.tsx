import { useState } from 'react';
import { CheckCircle2, Plus, RefreshCw, Settings, ChevronDown, ChevronUp, ExternalLink, AlertCircle } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  enabled: boolean;
  lastSync?: string;
}

interface BrokerConnection {
  id: string;
  name: string;
  logo: string;
  connected: boolean;
  accounts: Account[];
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface ConnectionsPageProps {
  theme: 'light' | 'dark';
}

export function ConnectionsPage({ theme }: ConnectionsPageProps) {
  const [connections, setConnections] = useState<BrokerConnection[]>([
    {
      id: 'ninjatrader',
      name: 'NinjaTrader',
      logo: '📊',
      connected: true,
      status: 'connected',
      lastSync: '2 minutes ago',
      accounts: [
        { id: 'nt-1', name: 'Main Account', accountNumber: '****8472', balance: 52840, enabled: true, lastSync: '2 minutes ago' },
        { id: 'nt-2', name: 'Practice Account', accountNumber: '****1234', balance: 100000, enabled: true, lastSync: '2 minutes ago' },
      ]
    },
    {
      id: 'interactive-brokers',
      name: 'Interactive Brokers',
      logo: '🏦',
      connected: true,
      status: 'connected',
      lastSync: '1 hour ago',
      accounts: [
        { id: 'ib-1', name: 'Funded Account', accountNumber: 'U****9876', balance: 28500, enabled: false, lastSync: '1 hour ago' },
      ]
    },
    {
      id: 'tradestation',
      name: 'TradeStation',
      logo: '📈',
      connected: false,
      status: 'disconnected',
      accounts: []
    },
    {
      id: 'td-ameritrade',
      name: 'TD Ameritrade',
      logo: '💼',
      connected: false,
      status: 'disconnected',
      accounts: []
    },
    {
      id: 'tradovate',
      name: 'Tradovate',
      logo: '⚡',
      connected: false,
      status: 'disconnected',
      accounts: []
    },
    {
      id: 'amp-futures',
      name: 'AMP Futures',
      logo: '🚀',
      connected: false,
      status: 'disconnected',
      accounts: []
    },
  ]);

  const [expandedBroker, setExpandedBroker] = useState<string | null>('ninjatrader');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerConnection | null>(null);

  const handleConnect = (broker: BrokerConnection) => {
    setSelectedBroker(broker);
    setShowConnectModal(true);
  };

  const handleDisconnect = (brokerId: string) => {
    setConnections(connections.map(conn => 
      conn.id === brokerId 
        ? { ...conn, connected: false, status: 'disconnected', accounts: [], lastSync: undefined }
        : conn
    ));
    if (expandedBroker === brokerId) {
      setExpandedBroker(null);
    }
  };

  const handleToggleAccount = (brokerId: string, accountId: string) => {
    setConnections(connections.map(conn => {
      if (conn.id === brokerId) {
        return {
          ...conn,
          accounts: conn.accounts.map(acc => 
            acc.id === accountId ? { ...acc, enabled: !acc.enabled } : acc
          )
        };
      }
      return conn;
    }));
  };

  const handleSync = (brokerId: string) => {
    // Simulate sync
    const now = new Date().toLocaleTimeString();
    setConnections(connections.map(conn => 
      conn.id === brokerId 
        ? { 
            ...conn, 
            lastSync: 'Just now',
            accounts: conn.accounts.map(acc => ({ ...acc, lastSync: 'Just now' }))
          }
        : conn
    ));
  };

  const connectedCount = connections.filter(c => c.connected).length;
  const activeAccountsCount = connections.reduce((sum, conn) => 
    sum + conn.accounts.filter(acc => acc.enabled).length, 0
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
          Broker Connections
        </h1>
        <p className={`text-lg ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-600'}`}>
          Connect your futures trading brokers to automatically import and analyze your trade data
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`${theme === 'dark' ? 'bg-[#252D3D]' : 'bg-white'} rounded-xl p-6 border ${theme === 'dark' ? 'border-[#404A5F]' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-600'}`}>
              Connected Brokers
            </span>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            {connectedCount}
          </div>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-500'}`}>
            of {connections.length} available
          </p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-[#252D3D]' : 'bg-white'} rounded-xl p-6 border ${theme === 'dark' ? 'border-[#404A5F]' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-600'}`}>
              Active Accounts
            </span>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            {activeAccountsCount}
          </div>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-500'}`}>
            syncing trade data
          </p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-[#252D3D]' : 'bg-white'} rounded-xl p-6 border ${theme === 'dark' ? 'border-[#404A5F]' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-600'}`}>
              Total Balance
            </span>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <span className="text-purple-500 text-lg">$</span>
            </div>
          </div>
          <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            ${connections.reduce((sum, conn) => 
              sum + conn.accounts.filter(acc => acc.enabled).reduce((accSum, acc) => accSum + acc.balance, 0), 0
            ).toLocaleString()}
          </div>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-500'}`}>
            across active accounts
          </p>
        </div>
      </div>

      {/* Broker Connections List */}
      <div className="space-y-4">
        {connections.map((broker) => (
          <div
            key={broker.id}
            className={`${theme === 'dark' ? 'bg-[#252D3D] border-[#404A5F]' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg`}
          >
            {/* Broker Header */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Broker Logo */}
                  <div className={`w-14 h-14 rounded-xl ${theme === 'dark' ? 'bg-[#2E3849]' : 'bg-gray-100'} flex items-center justify-center text-3xl`}>
                    {broker.logo}
                  </div>

                  {/* Broker Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                        {broker.name}
                      </h3>
                      {broker.connected && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          Connected
                        </span>
                      )}
                    </div>
                    {broker.connected && broker.lastSync && (
                      <p className={`text-sm ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-500'}`}>
                        Last synced {broker.lastSync}
                      </p>
                    )}
                  </div>

                  {/* Account Count */}
                  {broker.connected && broker.accounts.length > 0 && (
                    <div className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-[#2E3849]' : 'bg-gray-100'}`}>
                      <div className={`text-xs font-medium ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-600'} mb-1`}>
                        Accounts
                      </div>
                      <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                        {broker.accounts.filter(acc => acc.enabled).length}/{broker.accounts.length}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 ml-4">
                  {broker.connected ? (
                    <>
                      <button
                        onClick={() => handleSync(broker.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                          theme === 'dark'
                            ? 'bg-[#2E3849] text-[#E6EDF3] hover:bg-[#364152]'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Sync
                      </button>
                      
                      {broker.accounts.length > 0 && (
                        <button
                          onClick={() => setExpandedBroker(expandedBroker === broker.id ? null : broker.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                            theme === 'dark'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Manage Accounts
                          {expandedBroker === broker.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleDisconnect(broker.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          theme === 'dark'
                            ? 'text-red-400 hover:bg-red-500/10'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(broker)}
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Expandable Accounts Section */}
            {broker.connected && expandedBroker === broker.id && broker.accounts.length > 0 && (
              <div className={`border-t ${theme === 'dark' ? 'border-[#404A5F] bg-[#1C2333]' : 'border-gray-200 bg-gray-50'} p-6`}>
                <h4 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-600'} uppercase tracking-wider`}>
                  Connected Accounts
                </h4>
                <div className="space-y-3">
                  {broker.accounts.map((account) => (
                    <div
                      key={account.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-[#252D3D]' : 'bg-white'
                      } border ${
                        account.enabled
                          ? theme === 'dark' ? 'border-blue-500/30 ring-1 ring-blue-500/20' : 'border-blue-200 ring-1 ring-blue-100'
                          : theme === 'dark' ? 'border-[#404A5F]' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg ${
                          account.enabled
                            ? 'bg-blue-500/10'
                            : theme === 'dark' ? 'bg-[#2E3849]' : 'bg-gray-100'
                        } flex items-center justify-center`}>
                          <span className={`text-2xl ${account.enabled ? 'opacity-100' : 'opacity-50'}`}>
                            💰
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className={`font-semibold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                              {account.name}
                            </h5>
                            <span className={`text-sm ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-500'}`}>
                              {account.accountNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-sm ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-600'}`}>
                              Balance: <span className="font-semibold">${account.balance.toLocaleString()}</span>
                            </span>
                            {account.lastSync && (
                              <span className={`text-xs ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-500'}`}>
                                Synced {account.lastSync}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {account.enabled && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 font-medium">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggleAccount(broker.id, account.id)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          account.enabled ? 'bg-blue-600' : theme === 'dark' ? 'bg-[#404A5F]' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            account.enabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-500/5 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-900'}`}>
                        Account Sync Settings
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-blue-300/80' : 'text-blue-700'}`}>
                        Only enabled accounts will sync trade data and appear in your dashboard analytics. 
                        Disabled accounts won't affect your performance metrics.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Connect Modal */}
      {showConnectModal && selectedBroker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-[#252D3D]' : 'bg-white'} rounded-2xl max-w-lg w-full p-8`}>
            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl ${
                theme === 'dark' ? 'bg-[#2E3849]' : 'bg-gray-100'
              }`}>
                {selectedBroker.logo}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                Connect to {selectedBroker.name}
              </h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-[#8B92A8]' : 'text-gray-600'}`}>
                Securely connect your {selectedBroker.name} account to import trade data
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                  API Key
                </label>
                <input
                  type="text"
                  placeholder="Enter your API key"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-[#1C2333] border-[#404A5F] text-[#E6EDF3] placeholder-[#8B92A8]'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                  API Secret
                </label>
                <input
                  type="password"
                  placeholder="Enter your API secret"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-[#1C2333] border-[#404A5F] text-[#E6EDF3] placeholder-[#8B92A8]'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-yellow-500/5 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-100'}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-yellow-300/80' : 'text-yellow-700'}`}>
                      Your API credentials are encrypted and stored securely. We only request read-only access to import your trade history.
                    </p>
                  </div>
                </div>
              </div>

              <button
                className="w-full flex items-center justify-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                How to get your {selectedBroker.name} API credentials
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-[#2E3849] text-[#E6EDF3] hover:bg-[#364152]'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Simulate connection
                  setConnections(connections.map(conn => 
                    conn.id === selectedBroker.id 
                      ? { 
                          ...conn, 
                          connected: true, 
                          status: 'connected', 
                          lastSync: 'Just now',
                          accounts: [
                            { 
                              id: `${conn.id}-demo`, 
                              name: 'Demo Account', 
                              accountNumber: '****' + Math.floor(Math.random() * 9999), 
                              balance: Math.floor(Math.random() * 50000) + 25000, 
                              enabled: true,
                              lastSync: 'Just now'
                            }
                          ]
                        }
                      : conn
                  ));
                  setExpandedBroker(selectedBroker.id);
                  setShowConnectModal(false);
                }}
                className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Connect Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
