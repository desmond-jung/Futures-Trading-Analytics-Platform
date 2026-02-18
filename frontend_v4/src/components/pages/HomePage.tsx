import { useState, useEffect, useMemo } from 'react';
import { Calendar, BarChart3, Copy, Bot, Users, Link, TrendingUp, TrendingDown } from 'lucide-react';
import { PageType, DailyPnL, Trade, transformBackendTradeToFrontend } from '../../App';

const API_URL = 'http://localhost:5001';

interface HomePageProps {
  theme: 'light' | 'dark';
  onNavigate: (page: PageType) => void;
  data?: DailyPnL[];  // Make optional with ?
}

interface FuturesContract {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export function HomePage({ theme, onNavigate, data = [] }: HomePageProps) {
  const textClass = theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600';
  const bgClass = theme === 'dark' ? 'bg-[#161B22]' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-[#2A2F3A]' : 'border-gray-200';

  const stats = useMemo(() => {
    // Safety check: if data is undefined or empty, return zero stats
    if (!data || data.length === 0) {
      return {
        totalPnL: 0,
        winRate: 0,
        totalTrades: 0,
      };
    }

    const allTrades = data.flatMap((day: DailyPnL) => day.trades || []);

    if (allTrades.length === 0){
      return {
        totalPnL: 0,
        winRate: 0,
        totalTrades: 0,
      };
    }

    const totalPnL = allTrades.reduce((sum: number, trade: Trade) => sum + trade.pnl, 0);

    const winningTrades = allTrades.filter((trade: Trade) => trade.pnl > 0);
    const winRate = (winningTrades.length / allTrades.length) * 100;
    const totalTrades = allTrades.length;
    
    return {
      totalPnL,
      winRate,
      totalTrades,
    };
  }, [data]);

  // State for recent trades
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // Fetch recent trades when component mounts
  useEffect(() => {
    const fetchRecentTrades = async () => {
      setIsLoadingRecent(true);
      try {
        const response = await fetch(`${API_URL}/api/trades`);
        if (!response.ok) throw new Error('Failed to fetch trades');
        
        const result = await response.json();
        const backendTrades = result.trades || [];
        
        // Transform backend trades to frontend format
        const trades: Trade[] = backendTrades.map(transformBackendTradeToFrontend);
        
        // Sort by exit_time (most recent first) and take top 3
        const sorted = trades
          .sort((a, b) => {
            // Compare by date and time
            const dateA = new Date(`${a.date}T${a.time}`).getTime();
            const dateB = new Date(`${b.date}T${b.time}`).getTime();
            return dateB - dateA;  // Descending order (newest first)
          })
          .slice(0, 3);  // Take only first 3
        
        setRecentTrades(sorted);
      } catch (error) {
        console.error('Error fetching recent trades:', error);
        setRecentTrades([]);
      } finally {
        setIsLoadingRecent(false);
      }
    };
    
    fetchRecentTrades();
  }, []);  // Empty array = run once on mount

  const quickLinks = [
    { id: 'calendar' as PageType, title: 'Calendar', description: 'View and manage your trades by date', icon: Calendar, color: 'blue' },
    { id: 'dashboard' as PageType, title: 'Dashboard', description: 'Analyze your trading performance', icon: BarChart3, color: 'purple' },
    { id: 'trade-copier' as PageType, title: 'Trade Copier', description: 'Copy trades across accounts', icon: Copy, color: 'green' },
    { id: 'trading-bot' as PageType, title: 'Trading Bot', description: 'Automated trading strategies', icon: Bot, color: 'orange' },
    { id: 'accounts' as PageType, title: 'Accounts', description: 'Manage your trading accounts', icon: Users, color: 'pink' },
    { id: 'connections' as PageType, title: 'Connections', description: 'Connect to brokers and APIs', icon: Link, color: 'teal' },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      pink: 'bg-pink-100 text-pink-600',
      teal: 'bg-teal-100 text-teal-600',
    };
    return colors[color] || colors.blue;
  };

  // Calculate PnL periods
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Today PnL
  const todayPnL = data.find(d => d.date === todayStr)?.pnl || 0;
  
  // Week PnL (last 7 days)
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekPnL = data
    .filter(d => new Date(d.date) >= weekAgo && new Date(d.date) <= today)
    .reduce((sum, d) => sum + d.pnl, 0);
  
  // Month PnL (current month)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthPnL = data
    .filter(d => new Date(d.date) >= monthStart && new Date(d.date) <= today)
    .reduce((sum, d) => sum + d.pnl, 0);
  
  // YTD PnL (year to date)
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const ytdPnL = data
    .filter(d => new Date(d.date) >= yearStart && new Date(d.date) <= today)
    .reduce((sum, d) => sum + d.pnl, 0);

  // Mock futures data (in a real app, this would come from an API)
  const futuresContracts: FuturesContract[] = [
    { symbol: '/ES', name: 'E-mini S&P 500', price: 6058.25, change: 23.50, changePercent: 0.39 },
    { symbol: '/NQ', name: 'E-mini Nasdaq', price: 21456.75, change: -42.25, changePercent: -0.20 },
    { symbol: '/YM', name: 'E-mini Dow', price: 44325.00, change: 156.00, changePercent: 0.35 },
    { symbol: '/RTY', name: 'E-mini Russell 2000', price: 2234.80, change: -8.30, changePercent: -0.37 },
    { symbol: '/GC', name: 'Gold', price: 2895.40, change: 12.80, changePercent: 0.44 },
    { symbol: '/SI', name: 'Silver', price: 32.45, change: -0.15, changePercent: -0.46 },
    { symbol: '/CL', name: 'Crude Oil', price: 73.28, change: 1.42, changePercent: 1.94 },
    { symbol: '/NG', name: 'Natural Gas', price: 3.67, change: -0.08, changePercent: -2.13 },
    { symbol: '/ZB', name: '30-Year T-Bond', price: 142.15, change: -0.22, changePercent: -0.15 },
    { symbol: '/ZN', name: '10-Year T-Note', price: 110.28, change: 0.09, changePercent: 0.08 },
  ];

  const formatCurrency = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}$${value.toFixed(2)}`;
  };

  const formatPrice = (price: number, decimals: number = 2) => {
    return price.toFixed(decimals);
  };

  const PnLCard = ({ title, value }: { title: string; value: number }) => {
    const isPositive = value >= 0;
    const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
    
    return (
      <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${textSecondaryClass}`}>{title}</span>
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
        </div>
        <div className={`text-3xl font-bold ${colorClass}`}>{formatCurrency(value)}</div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${textClass} mb-2`}>Welcome to Trading Hub</h1>
        <p className={`text-lg ${textSecondaryClass}`}>
          Your comprehensive platform for tracking, analyzing, and optimizing your trading performance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${textSecondaryClass}`}>Total P&L</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
          </div>
          <div className={`text-xs ${textSecondaryClass} mt-1`}>This month</div>
        </div>

        <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${textSecondaryClass}`}>Win Rate</span>
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div className={`text-3xl font-bold ${textClass}`}>{stats.winRate.toFixed(1)}%</div>
          <div className={`text-xs ${textSecondaryClass} mt-1`}>Last 30 days</div>
        </div>

        <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${textSecondaryClass}`}>Total Trades</span>
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div className={`text-3xl font-bold ${textClass}`}>{stats.totalTrades}</div>
          <div className={`text-xs ${textSecondaryClass} mt-1`}>This month</div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className={`text-2xl font-bold ${textClass} mb-4`}>Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6 hover:shadow-md transition-all text-left group`}
              >
                <div className={`w-12 h-12 rounded-lg ${getColorClasses(link.color)} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-semibold ${textClass} mb-1`}>{link.title}</h3>
                <p className={`text-sm ${textSecondaryClass}`}>{link.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className={`text-2xl font-bold ${textClass} mb-4`}>Recent Activity</h2>
        <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
        <div className="space-y-4">
            {isLoadingRecent ? (
              <div className={`text-center ${textSecondaryClass}`}>Loading recent activity...</div>
            ) : recentTrades.length === 0 ? (
              <div className={`text-center ${textSecondaryClass}`}>No recent trades</div>
            ) : (
              recentTrades.map((trade) => {
                const isWin = trade.pnl > 0;
                const pnlColor = isWin ? 'text-green-600' : 'text-red-600';
                const dotColor = isWin ? 'bg-green-500' : 'bg-red-500';
                
                // Format time ago (simplified - you can use a library like date-fns for better formatting)
                const tradeDate = new Date(`${trade.date}T${trade.time}`);
                const now = new Date();
                const hoursAgo = Math.floor((now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60));
                const timeAgo = hoursAgo < 1 ? 'Just now' : 
                               hoursAgo === 1 ? '1 hour ago' : 
                               `${hoursAgo} hours ago`;
                
                return (
                  <div key={trade.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
                      <div>
                        <p className={`font-medium ${textClass}`}>
                          Trade: {trade.symbol} {trade.side.charAt(0).toUpperCase() + trade.side.slice(1)}
                        </p>
                        <p className={`text-sm ${textSecondaryClass}`}>{timeAgo}</p>
                      </div>
                    </div>
                    <span className={`${pnlColor} font-semibold`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* PnL Overview (Additional) */}
      <div className="mt-8">
        <h2 className={`text-2xl font-bold ${textClass} mb-4`}>Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PnLCard title="Today P&L" value={todayPnL} />
          <PnLCard title="Week P&L" value={weekPnL} />
          <PnLCard title="Month P&L" value={monthPnL} />
          <PnLCard title="YTD P&L" value={ytdPnL} />
        </div>
      </div>

      {/* Futures Market Overview */}
      <div>
        <h2 className={`text-2xl font-bold ${textClass} mb-4`}>Futures Market Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {futuresContracts.map((contract) => {
            const isPositive = contract.change >= 0;
            const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
            const bgChangeColor = isPositive 
              ? (theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50')
              : (theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50');
            
            return (
              <div
                key={contract.symbol}
                className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className={`text-lg font-bold ${textClass}`}>{contract.symbol}</h3>
                    <p className={`text-xs ${textSecondaryClass} mt-0.5`}>{contract.name}</p>
                  </div>
                  {isPositive ? (
                    <TrendingUp className={`w-4 h-4 ${changeColor}`} />
                  ) : (
                    <TrendingDown className={`w-4 h-4 ${changeColor}`} />
                  )}
                </div>
                
                <div className={`text-2xl font-bold ${textClass} mb-2`}>
                  {formatPrice(contract.price)}
                </div>
                
                <div className={`flex items-center gap-2 text-sm ${changeColor}`}>
                  <span className={`${bgChangeColor} px-2 py-0.5 rounded`}>
                    {isPositive ? '+' : ''}{formatPrice(contract.change)}
                  </span>
                  <span>
                    {isPositive ? '+' : ''}{contract.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
