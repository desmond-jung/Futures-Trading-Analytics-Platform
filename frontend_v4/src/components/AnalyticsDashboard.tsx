import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, BarChart3, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis } from 'recharts';
import { DailyPnL } from '../App';

interface AnalyticsDashboardProps {
  data: DailyPnL[];
  theme: 'light' | 'dark';
}

type DateRangePreset = 'today' | 'week' | 'month' | '90days' | 'ytd' | '1year' | 'all' | 'custom';
type TradeOutcome = 'all' | 'win' | 'loss' | 'be';
type DashboardTab = 'overview' | 'behavior' | 'risk' | 'performance';

// Trading session time ranges (in hours, 24h format)
const SESSIONS = {
  'all': { name: 'All Sessions', start: 0, end: 24 },
  'asia': { name: 'Asia', start: 18, end: 3 }, // 6pm-3am ET
  'london': { name: 'London', start: 3, end: 12 }, // 3am-12pm ET
  'ny': { name: 'New York', start: 9, end: 16 }, // 9am-4pm ET
  'ny-lunch': { name: 'NY Lunch', start: 11, end: 14 }, // 11am-2pm ET
};

export function AnalyticsDashboard({ data, theme }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('month');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('all');
  const [selectedSide, setSelectedSide] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<TradeOutcome>('all');

  // Calculate date range based on preset
  const dateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (dateRangePreset) {
      case 'today':
        return { start: todayStr, end: todayStr };
      
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo.toISOString().split('T')[0], end: todayStr };
      }
      
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart.toISOString().split('T')[0], end: todayStr };
      }
      
      case '90days': {
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return { start: ninetyDaysAgo.toISOString().split('T')[0], end: todayStr };
      }
      
      case 'ytd': {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return { start: yearStart.toISOString().split('T')[0], end: todayStr };
      }
      
      case '1year': {
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return { start: oneYearAgo.toISOString().split('T')[0], end: todayStr };
      }
      
      case 'custom':
        return customDateRange;
      
      case 'all':
      default:
        return { start: '', end: '' };
    }
  }, [dateRangePreset, customDateRange]);

  // Extract all unique strategies, symbols, accounts from the data
  const { strategies, symbols, accounts } = useMemo(() => {
    const strategySet = new Set<string>();
    const symbolSet = new Set<string>();
    const accountSet = new Set<string>();
    
    data.forEach(day => {
      day.trades.forEach(trade => {
        trade.tags.forEach(tag => strategySet.add(tag));
        symbolSet.add(trade.symbol);
        if (trade.account) accountSet.add(trade.account);
      });
    });
    
    return {
      strategies: ['all', ...Array.from(strategySet)],
      symbols: ['all', ...Array.from(symbolSet)],
      accounts: ['all', ...Array.from(accountSet)]
    };
  }, [data]);

  // Helper function to check if time is within session
  const isInSession = (time: string, sessionKey: string): boolean => {
    if (sessionKey === 'all') return true;
    
    const session = SESSIONS[sessionKey as keyof typeof SESSIONS];
    if (!session) return true;
    
    const hour = parseInt(time.split(':')[0]);
    
    // Handle sessions that cross midnight (like Asia)
    if (session.start > session.end) {
      return hour >= session.start || hour < session.end;
    }
    
    return hour >= session.start && hour < session.end;
  };

  // Filter trades based on all filters
  const filteredTrades = useMemo(() => {
    return data.flatMap(day => {
      // Date range filter
      if (dateRange.start && day.date < dateRange.start) return [];
      if (dateRange.end && day.date > dateRange.end) return [];
      
      return day.trades.filter(trade => {
        // Strategy filter
        if (selectedStrategy !== 'all' && !trade.tags.includes(selectedStrategy)) return false;
        
        // Session filter
        if (!isInSession(trade.time, selectedSession)) return false;
        
        // Account filter
        if (selectedAccount !== 'all' && trade.account !== selectedAccount) return false;
        
        // Symbol filter
        if (selectedSymbol !== 'all' && trade.symbol !== selectedSymbol) return false;
        
        // Side/Direction filter
        if (selectedSide !== 'all' && trade.side !== selectedSide) return false;
        
        // Win/Loss/BE filter
        if (selectedOutcome !== 'all') {
          if (selectedOutcome === 'win' && trade.pnl <= 0) return false;
          if (selectedOutcome === 'loss' && trade.pnl >= 0) return false;
          if (selectedOutcome === 'be' && trade.pnl !== 0) return false;
        }
        
        return true;
      });
    });
  }, [data, dateRange, selectedStrategy, selectedSession, selectedAccount, selectedSymbol, selectedSide, selectedOutcome]);

  // Sort trades by date and time
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => 
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );
  }, [filteredTrades]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        totalPnL: 0,
        winRate: 0,
        avgRR: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakEvenTrades: 0,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0,
        profitFactor: 0,
        largestWin: 0,
        largestLoss: 0,
      };
    }

    const totalPnL = filteredTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winningTrades = filteredTrades.filter(t => t.pnl > 0);
    const losingTrades = filteredTrades.filter(t => t.pnl < 0);
    const breakEvenTrades = filteredTrades.filter(t => t.pnl === 0);
    const winRate = (winningTrades.length / filteredTrades.length) * 100;
    const avgRR = filteredTrades.reduce((sum, t) => sum + t.riskReward, 0) / filteredTrades.length;
    
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0;

    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;
    
    sortedTrades.forEach(trade => {
      runningTotal += trade.pnl;
      if (runningTotal > peak) peak = runningTotal;
      const drawdown = peak - runningTotal;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    return {
      totalPnL,
      winRate,
      avgRR,
      totalTrades: filteredTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      avgWin,
      avgLoss,
      maxDrawdown,
      profitFactor,
      largestWin,
      largestLoss,
    };
  }, [filteredTrades, sortedTrades]);

  // Equity Curve Data
  const equityCurveData = useMemo(() => {
    let cumulative = 0;
    
    return sortedTrades.map((trade, index) => {
      cumulative += trade.pnl;
      return {
        index: index + 1,
        equity: cumulative,
        date: trade.date
      };
    });
  }, [sortedTrades]);

  // Win/Loss Distribution Data
  const winLossData = [
    { name: 'Wins', value: stats.winningTrades, color: '#10b981' },
    { name: 'Losses', value: stats.losingTrades, color: '#ef4444' },
    { name: 'Break Even', value: stats.breakEvenTrades, color: '#6b7280' }
  ].filter(item => item.value > 0);

  // Strategy Performance Data
  const strategyData = useMemo(() => {
    const strategyStats = new Map<string, { pnl: number; trades: number }>();
    
    filteredTrades.forEach(trade => {
      trade.tags.forEach(tag => {
        const existing = strategyStats.get(tag) || { pnl: 0, trades: 0 };
        strategyStats.set(tag, {
          pnl: existing.pnl + trade.pnl,
          trades: existing.trades + 1
        });
      });
    });

    return Array.from(strategyStats.entries()).map(([name, data]) => ({
      name,
      pnl: data.pnl,
      trades: data.trades
    })).sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  // Time of Day Heatmap Data
  const timeHeatmapData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourStats = new Map<number, { pnl: number; trades: number }>();
    
    filteredTrades.forEach(trade => {
      const hour = parseInt(trade.time.split(':')[0]);
      const existing = hourStats.get(hour) || { pnl: 0, trades: 0 };
      hourStats.set(hour, {
        pnl: existing.pnl + trade.pnl,
        trades: existing.trades + 1
      });
    });

    return hours.map(hour => ({
      hour: `${hour}:00`,
      pnl: hourStats.get(hour)?.pnl || 0,
      trades: hourStats.get(hour)?.trades || 0,
      avgPnl: hourStats.get(hour) ? hourStats.get(hour)!.pnl / hourStats.get(hour)!.trades : 0
    }));
  }, [filteredTrades]);

  // BEHAVIOR TAB DATA
  // Performance after consecutive wins/losses
  const consecutivePerformanceData = useMemo(() => {
    const afterWins: number[] = [];
    const afterLosses: number[] = [];
    
    for (let i = 1; i < sortedTrades.length; i++) {
      const prevTrade = sortedTrades[i - 1];
      const currentTrade = sortedTrades[i];
      
      if (prevTrade.pnl > 0) {
        afterWins.push(currentTrade.pnl);
      } else if (prevTrade.pnl < 0) {
        afterLosses.push(currentTrade.pnl);
      }
    }

    // Calculate streaks (2, 3, 4+ consecutive)
    const streakData = [];
    for (let streakLen = 1; streakLen <= 4; streakLen++) {
      let afterWinStreak: number[] = [];
      let afterLossStreak: number[] = [];
      
      for (let i = streakLen; i < sortedTrades.length; i++) {
        let isWinStreak = true;
        let isLossStreak = true;
        
        for (let j = 1; j <= streakLen; j++) {
          if (sortedTrades[i - j].pnl <= 0) isWinStreak = false;
          if (sortedTrades[i - j].pnl >= 0) isLossStreak = false;
        }
        
        if (isWinStreak) afterWinStreak.push(sortedTrades[i].pnl);
        if (isLossStreak) afterLossStreak.push(sortedTrades[i].pnl);
      }
      
      const label = streakLen === 4 ? '4+ Wins' : `${streakLen} Win${streakLen > 1 ? 's' : ''}`;
      const lossLabel = streakLen === 4 ? '4+ Losses' : `${streakLen} Loss${streakLen > 1 ? 'es' : ''}`;
      
      if (afterWinStreak.length > 0) {
        streakData.push({
          name: `After ${label}`,
          avgPnl: afterWinStreak.reduce((a, b) => a + b, 0) / afterWinStreak.length,
          trades: afterWinStreak.length,
          type: 'afterWin'
        });
      }
      
      if (afterLossStreak.length > 0) {
        streakData.push({
          name: `After ${lossLabel}`,
          avgPnl: afterLossStreak.reduce((a, b) => a + b, 0) / afterLossStreak.length,
          trades: afterLossStreak.length,
          type: 'afterLoss'
        });
      }
    }
    
    return streakData;
  }, [sortedTrades]);

  // Day of week performance
  const dayOfWeekData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = new Map<number, { pnl: number; trades: number }>();
    
    filteredTrades.forEach(trade => {
      const dayOfWeek = new Date(trade.date).getDay();
      const existing = dayStats.get(dayOfWeek) || { pnl: 0, trades: 0 };
      dayStats.set(dayOfWeek, {
        pnl: existing.pnl + trade.pnl,
        trades: existing.trades + 1
      });
    });
    
    return days.map((day, index) => ({
      day,
      avgPnl: dayStats.get(index) ? dayStats.get(index)!.pnl / dayStats.get(index)!.trades : 0,
      totalPnl: dayStats.get(index)?.pnl || 0,
      trades: dayStats.get(index)?.trades || 0
    })).filter(d => d.trades > 0);
  }, [filteredTrades]);

  // First trade vs subsequent trades
  const firstTradeData = useMemo(() => {
    const dailyTrades = new Map<string, typeof sortedTrades>();
    
    sortedTrades.forEach(trade => {
      if (!dailyTrades.has(trade.date)) {
        dailyTrades.set(trade.date, []);
      }
      dailyTrades.get(trade.date)!.push(trade);
    });
    
    const firstTrades: number[] = [];
    const subsequentTrades: number[] = [];
    
    dailyTrades.forEach(trades => {
      if (trades.length > 0) {
        firstTrades.push(trades[0].pnl);
        subsequentTrades.push(...trades.slice(1).map(t => t.pnl));
      }
    });
    
    return [
      {
        name: 'First Trade of Day',
        avgPnl: firstTrades.length > 0 ? firstTrades.reduce((a, b) => a + b, 0) / firstTrades.length : 0,
        trades: firstTrades.length,
        winRate: firstTrades.length > 0 ? (firstTrades.filter(p => p > 0).length / firstTrades.length) * 100 : 0
      },
      {
        name: 'Subsequent Trades',
        avgPnl: subsequentTrades.length > 0 ? subsequentTrades.reduce((a, b) => a + b, 0) / subsequentTrades.length : 0,
        trades: subsequentTrades.length,
        winRate: subsequentTrades.length > 0 ? (subsequentTrades.filter(p => p > 0).length / subsequentTrades.length) * 100 : 0
      }
    ];
  }, [sortedTrades]);

  // RISK MANAGEMENT TAB DATA
  // R:R Distribution
  const rrDistributionData = useMemo(() => {
    const buckets = [
      { min: 0, max: 0.5, label: '0-0.5' },
      { min: 0.5, max: 1, label: '0.5-1' },
      { min: 1, max: 1.5, label: '1-1.5' },
      { min: 1.5, max: 2, label: '1.5-2' },
      { min: 2, max: 3, label: '2-3' },
      { min: 3, max: Infinity, label: '3+' }
    ];
    
    return buckets.map(bucket => {
      const tradesInBucket = filteredTrades.filter(t => 
        t.riskReward >= bucket.min && t.riskReward < bucket.max
      );
      return {
        range: bucket.label,
        trades: tradesInBucket.length,
        avgPnl: tradesInBucket.length > 0 
          ? tradesInBucket.reduce((sum, t) => sum + t.pnl, 0) / tradesInBucket.length 
          : 0
      };
    });
  }, [filteredTrades]);

  // Drawdown over time
  const drawdownData = useMemo(() => {
    let peak = 0;
    let cumulative = 0;
    
    return sortedTrades.map((trade, index) => {
      cumulative += trade.pnl;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak - cumulative;
      
      return {
        index: index + 1,
        drawdown: -drawdown,
        date: trade.date
      };
    });
  }, [sortedTrades]);

  // PERFORMANCE TAB DATA
  // Symbol performance
  const symbolPerformanceData = useMemo(() => {
    const symbolStats = new Map<string, { pnl: number; trades: number; wins: number }>();
    
    filteredTrades.forEach(trade => {
      const existing = symbolStats.get(trade.symbol) || { pnl: 0, trades: 0, wins: 0 };
      symbolStats.set(trade.symbol, {
        pnl: existing.pnl + trade.pnl,
        trades: existing.trades + 1,
        wins: existing.wins + (trade.pnl > 0 ? 1 : 0)
      });
    });
    
    return Array.from(symbolStats.entries()).map(([symbol, data]) => ({
      symbol,
      pnl: data.pnl,
      trades: data.trades,
      winRate: (data.wins / data.trades) * 100
    })).sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  // Session performance
  const sessionPerformanceData = useMemo(() => {
    const sessionStats = new Map<string, { pnl: number; trades: number; wins: number }>();
    
    filteredTrades.forEach(trade => {
      // Determine which session this trade belongs to
      let tradeSession = 'Other';
      for (const [key, session] of Object.entries(SESSIONS)) {
        if (key !== 'all' && isInSession(trade.time, key)) {
          tradeSession = session.name;
          break;
        }
      }
      
      const existing = sessionStats.get(tradeSession) || { pnl: 0, trades: 0, wins: 0 };
      sessionStats.set(tradeSession, {
        pnl: existing.pnl + trade.pnl,
        trades: existing.trades + 1,
        wins: existing.wins + (trade.pnl > 0 ? 1 : 0)
      });
    });
    
    return Array.from(sessionStats.entries()).map(([session, data]) => ({
      session,
      pnl: data.pnl,
      avgPnl: data.pnl / data.trades,
      trades: data.trades,
      winRate: (data.wins / data.trades) * 100
    }));
  }, [filteredTrades]);

  // Long vs Short
  const longShortData = useMemo(() => {
    const longTrades = filteredTrades.filter(t => t.side === 'long');
    const shortTrades = filteredTrades.filter(t => t.side === 'short');
    
    return [
      {
        direction: 'Long',
        pnl: longTrades.reduce((sum, t) => sum + t.pnl, 0),
        trades: longTrades.length,
        winRate: longTrades.length > 0 ? (longTrades.filter(t => t.pnl > 0).length / longTrades.length) * 100 : 0,
        avgPnl: longTrades.length > 0 ? longTrades.reduce((sum, t) => sum + t.pnl, 0) / longTrades.length : 0
      },
      {
        direction: 'Short',
        pnl: shortTrades.reduce((sum, t) => sum + t.pnl, 0),
        trades: shortTrades.length,
        winRate: shortTrades.length > 0 ? (shortTrades.filter(t => t.pnl > 0).length / shortTrades.length) * 100 : 0,
        avgPnl: shortTrades.length > 0 ? shortTrades.reduce((sum, t) => sum + t.pnl, 0) / shortTrades.length : 0
      }
    ];
  }, [filteredTrades]);

  const textClass = theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600';
  const bgClass = theme === 'dark' ? 'bg-[#252D3D]' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-[#404A5F]' : 'border-gray-200';
  const cardBgClass = theme === 'dark' ? 'bg-[#1F2633]' : 'bg-gray-50';

  const tabs = [
    { id: 'overview' as DashboardTab, label: 'Overview' },
    { id: 'behavior' as DashboardTab, label: 'Behavior' },
    { id: 'risk' as DashboardTab, label: 'Risk Management' },
    { id: 'performance' as DashboardTab, label: 'Performance' }
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass}`}>
        <div className="flex border-b border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                activeTab === tab.id
                  ? `${textClass} border-b-2 border-blue-500`
                  : `${textSecondaryClass} hover:text-gray-300`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-4`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className={`w-5 h-5 ${textSecondaryClass}`} />
          <h3 className={`font-semibold ${textClass}`}>Filters</h3>
        </div>
        
        <div className="flex items-end gap-3 overflow-x-auto pb-2">
          {/* Date Range Preset */}
          <div className="min-w-[180px]">
            <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>Date Range</label>
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value as DateRangePreset)}
              className={`w-full px-3 py-2 border ${borderClass} rounded text-sm ${
                theme === 'dark' ? 'bg-[#2E3849] text-white' : 'bg-white'
              }`}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="90days">Last 90 Days</option>
              <option value="ytd">Year to Date</option>
              <option value="1year">Last Year</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range (shown when custom is selected) */}
          {dateRangePreset === 'custom' && (
            <>
              <div className="min-w-[140px]">
                <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>Start Date</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className={`w-full px-3 py-2 border ${borderClass} rounded text-sm ${
                    theme === 'dark' ? 'bg-[#2E3849] text-white' : 'bg-white'
                  }`}
                />
              </div>
              <div className="min-w-[140px]">
                <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>End Date</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className={`w-full px-3 py-2 border ${borderClass} rounded text-sm ${
                    theme === 'dark' ? 'bg-[#2E3849] text-white' : 'bg-white'
                  }`}
                />
              </div>
            </>
          )}

          {/* Strategy Filter */}
          <div className="min-w-[140px]">
            <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>Strategy</label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className={`w-full px-3 py-2 border ${borderClass} rounded text-sm ${
                theme === 'dark' ? 'bg-[#2E3849] text-white' : 'bg-white'
              }`}
            >
              {strategies.map(strategy => (
                <option key={strategy} value={strategy}>
                  {strategy === 'all' ? 'All Strategies' : strategy}
                </option>
              ))}
            </select>
          </div>

          {/* Session Filter */}
          <div className="min-w-[140px]">
            <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className={`w-full px-3 py-2 border ${borderClass} rounded text-sm ${
                theme === 'dark' ? 'bg-[#2E3849] text-white' : 'bg-white'
              }`}
            >
              {Object.entries(SESSIONS).map(([key, session]) => (
                <option key={key} value={key}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div className="min-w-[140px]">
            <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className={`w-full px-3 py-2 border ${borderClass} rounded text-sm ${
                theme === 'dark' ? 'bg-[#2E3849] text-white' : 'bg-white'
              }`}
            >
              {accounts.map(account => (
                <option key={account} value={account}>
                  {account === 'all' ? 'All Accounts' : account}
                </option>
              ))}
            </select>
          </div>

          {/* Symbol Filter */}
          <div className="min-w-[120px]">
            <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>Symbol</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className={`w-full px-3 py-2 border ${borderClass} rounded text-sm ${
                theme === 'dark' ? 'bg-[#2E3849] text-white' : 'bg-white'
              }`}
            >
              {symbols.map(symbol => (
                <option key={symbol} value={symbol}>
                  {symbol === 'all' ? 'All Symbols' : symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Side/Direction Filter */}
          <div className="min-w-[140px]">
            <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>Direction</label>
            <select
              value={selectedSide}
              onChange={(e) => setSelectedSide(e.target.value)}
              className={`w-full px-3 py-2 border ${borderClass} rounded text-sm ${
                theme === 'dark' ? 'bg-[#2E3849] text-white' : 'bg-white'
              }`}
            >
              <option value="all">All Directions</option>
              <option value="long">Long Only</option>
              <option value="short">Short Only</option>
            </select>
          </div>

          {/* Win/Loss/BE Filter */}
          <div className="min-w-[130px]">
            <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>Outcome</label>
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value as TradeOutcome)}
              className={`w-full px-3 py-2 border ${borderClass} rounded text-sm ${
                theme === 'dark' ? 'bg-[#2E3849] text-white' : 'bg-white'
              }`}
            >
              <option value="all">All Outcomes</option>
              <option value="win">Wins Only</option>
              <option value="loss">Losses Only</option>
              <option value="be">Break Even</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total P&L */}
        <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${textSecondaryClass}`}>Total P&L</span>
            {stats.totalPnL >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
          </div>
          <div className={`text-xs ${textSecondaryClass} mt-1`}>{stats.totalTrades} total trades</div>
        </div>

        {/* Win Rate */}
        <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${textSecondaryClass}`}>Win Rate</span>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div className={`text-3xl font-bold ${textClass}`}>{stats.winRate.toFixed(1)}%</div>
          <div className={`text-xs ${textSecondaryClass} mt-1`}>
            {stats.winningTrades}W / {stats.losingTrades}L / {stats.breakEvenTrades}BE
          </div>
        </div>

        {/* Average R:R */}
        <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${textSecondaryClass}`}>Avg Risk:Reward</span>
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div className={`text-3xl font-bold ${textClass}`}>{stats.avgRR.toFixed(2)}</div>
          <div className={`text-xs ${textSecondaryClass} mt-1`}>
            Win: ${stats.avgWin.toFixed(0)} / Loss: ${stats.avgLoss.toFixed(0)}
          </div>
        </div>

        {/* Max Drawdown */}
        <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${textSecondaryClass}`}>Max Drawdown</span>
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-600">-${stats.maxDrawdown.toFixed(2)}</div>
          <div className={`text-xs ${textSecondaryClass} mt-1`}>
            Profit Factor: {stats.profitFactor.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Charts Row 1: Equity Curve & Win/Loss */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Equity Curve */}
            <div className={`lg:col-span-2 ${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>Equity Curve</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={equityCurveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="index" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    name="Cumulative P&L"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Win/Loss Pie Chart */}
            <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>Win/Loss Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2: Strategy Performance & Time Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Strategy Performance */}
            <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>Strategy Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={strategyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="name" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="pnl" fill="#8b5cf6" name="P&L" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Time of Day Heatmap */}
            <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>Performance by Hour</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeHeatmapData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="hour" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="avgPnl" fill="#14b8a6" name="Avg P&L" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'behavior' && (
        <>
          {/* Behavior Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance After Streaks */}
            <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>Performance After Consecutive Trades</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={consecutivePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="name" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="avgPnl" fill="#f59e0b" name="Avg P&L" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Day of Week Performance */}
            <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>Performance by Day of Week</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="day" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="totalPnl" fill="#10b981" name="Total P&L" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* First Trade vs Subsequent */}
            <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>First Trade vs Subsequent Trades</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={firstTradeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="name" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 11 }}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="avgPnl" fill="#6366f1" name="Avg P&L" />
                  <Bar dataKey="winRate" fill="#ec4899" name="Win Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'risk' && (
        <>
          {/* Risk Management Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* R:R Distribution */}
            <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>Risk:Reward Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rrDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="range" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="trades" fill="#8b5cf6" name="Trades" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Drawdown Over Time */}
            <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>Drawdown Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={drawdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="index" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="drawdown" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                    name="Drawdown"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'performance' && (
        <>
          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Symbol Performance */}
            <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>Performance by Symbol</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={symbolPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="symbol" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="pnl" fill="#10b981" name="P&L" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Session Performance */}
            <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>Performance by Session</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sessionPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="session" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="pnl" fill="#3b82f6" name="Total P&L" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Long vs Short */}
            <div className={`${bgClass} rounded-lg shadow-sm border ${borderClass} p-6`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>Long vs Short Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={longShortData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="direction" 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="pnl" fill="#f59e0b" name="Total P&L" />
                  <Bar dataKey="winRate" fill="#06b6d4" name="Win Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
