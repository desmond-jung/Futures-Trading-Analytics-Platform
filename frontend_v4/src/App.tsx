import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CalendarPage } from './components/pages/CalendarPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { HomePage } from './components/pages/HomePage';
import { ComingSoonPage } from './components/pages/ComingSoonPage';
import { ConnectionsPage } from './components/pages/ConnectionsPage';
import { ImportModal } from './components/ImportModal';
import { TradingRulesPanel } from './components/TradingRulesPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { AIInsights } from './components/AIInsights';
import { QueryAssistant } from './components/QueryAssistant';
import { MarketEvents } from './components/MarketEvents';
import { ProfileMenu } from './components/ProfileMenu';

const API_URL = 'http://localhost:5001';

export interface Trade {
  id: string;
  date: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  riskReward: number;
  tags: string[];
  notes?: string;
  time: string;
  screenshots?: string[];
  account?: string;
  duration?: number; // in minutes
}

export interface DailyPnL {
  date: string;
  pnl: number;
  trades: Trade[];
}

export interface TradingRule {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  currency: string;
  timezone: string;
}

export type PageType = 'home' | 'calendar' | 'dashboard' | 'ai-insights' | 'query' | 'market-events' | 'trade-copier' | 'trading-bot' | 'accounts' | 'connections';

// Transform backend trade format to frontend format
export const transformBackendTradeToFrontend = (backendTrade: any): Trade => {
  const entryTime = new Date(backendTrade.entry_time);
  const date = entryTime.toISOString().split('T')[0];
  
  const hours = entryTime.getHours().toString().padStart(2, '0');
  const minutes = entryTime.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${minutes}`;
  
  const side = backendTrade.direction?.toLowerCase() === 'short' ? 'short' : 'long';
  
  // Calculate duration in minutes if both times are available
  let duration: number | undefined = undefined;
  if (backendTrade.entry_time && backendTrade.exit_time) {
    const entry = new Date(backendTrade.entry_time);
    const exit = new Date(backendTrade.exit_time);
    duration = Math.round((exit.getTime() - entry.getTime()) / (1000 * 60));
  }
  
  return {
    id: backendTrade.id,
    date: date,
    symbol: backendTrade.symbol,
    side: side as 'long' | 'short',
    entryPrice: backendTrade.entry_price,
    exitPrice: backendTrade.exit_price,
    quantity: backendTrade.quantity,
    pnl: backendTrade.pnl,
    riskReward: 1, // Default value, not in backend model
    tags: backendTrade.tags || [], // Use tags array from backend
    notes: backendTrade.notes || '', // Use notes from backend
    time: time,
    screenshots: [],
    account: backendTrade.acc_id,
    duration: duration
  };
};

// Fetch calendar data from backend
const fetchCalendarData = async (year: number, month: number): Promise<DailyPnL[]> => {
  try {
    // Calculate the last day of the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;
    
    const response = await fetch(`${API_URL}/api/pnl/daily?start_date=${startDate}&end_date=${endDate}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform backend format to frontend format
    const dailyData: DailyPnL[] = (data.data || []).map((day: any) => ({
      date: day.date,
      pnl: day.pnl || 0,
      trades: (day.trades || []).map(transformBackendTradeToFrontend)
    }));
    
    return dailyData;
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return [];
  }
};

// Mock data for demonstration (kept as fallback)
const generateMockData = (year: number, month: number): DailyPnL[] => {
  const data: DailyPnL[] = [];
  const strategies = ['Breakout', 'Scalp', 'Reversal', 'Trend Following', 'Support/Resistance'];
  const symbols = ['/ES', '/NQ', '/MNQ', '/YM', '/RTY', '/MES', '/GC', '/MGC', '/CL', '/NKD'];
  const accounts = ['Main Account', 'Practice Account', 'Funded Account'];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Create more realistic trading patterns
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    
    // Vary number of trades by day (more on trending days)
    const numTrades = Math.floor(Math.random() * 6) + 2;
    const trades: Trade[] = [];
    let dailyPnL = 0;
    
    // Determine if this is a winning or losing day (70% win days)
    const isWinningDay = Math.random() > 0.3;
    
    for (let i = 0; i < numTrades; i++) {
      // Create more realistic time progression throughout the day
      const sessionTimes = [
        { start: 2, end: 8, name: 'asia' },     // Asia session
        { start: 8, end: 12, name: 'london' },   // London session
        { start: 9, end: 16, name: 'ny' },       // NY session
        { start: 11, end: 14, name: 'ny-lunch' } // NY lunch
      ];
      
      const session = sessionTimes[Math.floor(Math.random() * sessionTimes.length)];
      const hour = Math.floor(Math.random() * (session.end - session.start)) + session.start;
      const minute = Math.floor(Math.random() * 60);
      
      // More realistic P&L with streaks
      let basePnl;
      if (i === 0) {
        // First trade of the day is more likely to be disciplined
        basePnl = isWinningDay ? Math.random() * 400 + 100 : -(Math.random() * 200 + 50);
      } else {
        // Subsequent trades affected by psychology
        if (consecutiveWins > 2) {
          // After 3+ wins, might get overconfident (smaller avg win)
          basePnl = isWinningDay ? Math.random() * 250 : -(Math.random() * 400 + 100);
        } else if (consecutiveLosses > 2) {
          // After 3+ losses, might revenge trade (bigger losses or recovery)
          basePnl = Math.random() > 0.6 ? Math.random() * 500 + 200 : -(Math.random() * 600 + 200);
        } else {
          basePnl = isWinningDay ? Math.random() * 350 + 50 : -(Math.random() * 250 + 50);
        }
      }
      
      // Add some break-even trades (5% chance)
      const pnl = Math.random() < 0.05 ? 0 : basePnl;
      
      // Track streaks
      if (pnl > 0) {
        consecutiveWins++;
        consecutiveLosses = 0;
      } else if (pnl < 0) {
        consecutiveLosses++;
        consecutiveWins = 0;
      }
      
      dailyPnL += pnl;
      
      // More realistic R:R ratios
      const rrBase = pnl > 0 ? 1.5 + Math.random() * 2 : 0.3 + Math.random() * 1.2;
      
      // Pick symbol with some preference (ES and NQ more common)
      let symbol;
      const symbolRandom = Math.random();
      if (symbolRandom < 0.35) symbol = '/ES';
      else if (symbolRandom < 0.65) symbol = '/NQ';
      else symbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      trades.push({
        id: `trade-${year}-${month}-${day}-${i}`,
        date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        symbol: symbol,
        side: Math.random() > 0.45 ? 'long' : 'short', // Slight bias to long
        entryPrice: symbol === '/ES' ? 5900 + Math.random() * 200 : 
                   symbol === '/NQ' ? 20000 + Math.random() * 1000 :
                   symbol === '/GC' ? 2800 + Math.random() * 100 :
                   100 + Math.random() * 400,
        exitPrice: symbol === '/ES' ? 5900 + Math.random() * 200 : 
                  symbol === '/NQ' ? 20000 + Math.random() * 1000 :
                  symbol === '/GC' ? 2800 + Math.random() * 100 :
                  100 + Math.random() * 400,
        quantity: symbol === '/ES' || symbol === '/NQ' ? Math.floor(Math.random() * 5) + 1 : 
                 Math.floor(Math.random() * 10) + 1,
        pnl: pnl,
        riskReward: rrBase,
        tags: [strategies[Math.floor(Math.random() * strategies.length)]],
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        notes: Math.random() > 0.7 ? [
          'Great setup, patient entry',
          'Moved stop to breakeven',
          'Held through pullback',
          'Took profit too early',
          'Should have waited for confirmation',
          'Revenge trade - broke rules',
          'Perfect execution'
        ][Math.floor(Math.random() * 7)] : undefined,
        screenshots: [],
        account: accounts[Math.floor(Math.random() * accounts.length)],
        duration: Math.floor(Math.random() * 90) + 5
      });
    }
    
    data.push({
      date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      pnl: dailyPnL,
      trades: trades
    });
  }
  
  return data;
};

const defaultRules: TradingRule[] = [
  { id: '1', title: 'Wait for confirmation', description: 'Wait for price action to confirm the setup before entering', enabled: true },
  { id: '2', title: 'Check higher timeframe', description: 'Always check the higher timeframe trend before taking a trade', enabled: true },
  { id: '3', title: 'Risk management', description: 'Never risk more than 1% of account on a single trade', enabled: true },
  { id: '4', title: 'Take profit at target', description: 'Don\'t be greedy, take profit when target is reached', enabled: true },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [tradeData, setTradeData] = useState<DailyPnL[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [tradingRules, setTradingRules] = useState<TradingRule[]>(defaultRules);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    currency: 'USD',
    timezone: 'America/New_York'
  });

  // Helper function to load calendar data (avoid duplication)
  const loadCalendarData = async (year: number, month: number) => {
    setIsLoading(true);
    try {
      // Fetch current month and previous month (for calendar display)
      const currentMonthData = await fetchCalendarData(year, month);
      
      // Also fetch previous month for calendar overflow days
      let prevMonthData: DailyPnL[] = [];
      if (month === 1) {
        prevMonthData = await fetchCalendarData(year - 1, 12);
      } else {
        prevMonthData = await fetchCalendarData(year, month - 1);
      }
      
      // Filter previous month to only last 6 days (for calendar overflow)
      const prevMonthLastDays = prevMonthData.filter(day => {
        const [dayYear, dayMonth, dayNum] = day.date.split('-').map(Number);
        const isPrevMonth = month === 1 
          ? (dayYear === year - 1 && dayMonth === 12)
          : (dayYear === year && dayMonth === month - 1);
        return isPrevMonth && dayNum >= 26;
      });
      
      // Combine and deduplicate by date (in case of overlaps)
      const combinedData = [...prevMonthLastDays, ...currentMonthData];
      const uniqueByDate = new Map<string, DailyPnL>();
      
      combinedData.forEach(day => {
        if (!uniqueByDate.has(day.date)) {
          // First time seeing this date - deduplicate trades within this day
          const uniqueTrades = new Map<string, Trade>();
          day.trades.forEach(trade => {
            if (!uniqueTrades.has(trade.id)) {
              uniqueTrades.set(trade.id, trade);
            }
          });
          uniqueByDate.set(day.date, {
            ...day,
            trades: Array.from(uniqueTrades.values()),
            pnl: Array.from(uniqueTrades.values()).reduce((sum, t) => sum + t.pnl, 0)
          });
        } else {
          // If duplicate date exists, merge trades and deduplicate
          const existing = uniqueByDate.get(day.date)!;
          const existingTradeIds = new Set(existing.trades.map(t => t.id));
          const newTrades = day.trades.filter(t => !existingTradeIds.has(t.id));
          if (newTrades.length > 0) {
            console.warn(`Duplicate date ${day.date} found, merging ${newTrades.length} new trades`);
            const allTrades = [...existing.trades, ...newTrades];
            uniqueByDate.set(day.date, {
              ...existing,
              trades: allTrades,
              pnl: allTrades.reduce((sum, t) => sum + t.pnl, 0)
            });
          }
        }
      });
      
      const finalData = Array.from(uniqueByDate.values());
      console.log(`Loaded ${finalData.length} unique trading days with ${finalData.reduce((sum, d) => sum + d.trades.length, 0)} total trades`);
      setTradeData(finalData);
    } catch (error) {
      console.error('Error loading trade data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or month changes
  useEffect(() => {
    loadCalendarData(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const handleMonthChange = (year: number, month: number) => {
    // Just update state - useEffect will handle the data loading
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleImportTrades = async () => {
    // After import, refresh the data from backend
    setShowImportModal(false);
    
    // Reload current month data using the helper function
    await loadCalendarData(currentYear, currentMonth);
  };

  const handleUpdateTrades = (date: string, updatedTrades: Trade[]) => {
    const newData = tradeData.map(day => {
      if (day.date === date) {
        const newPnL = updatedTrades.reduce((sum, t) => sum + t.pnl, 0);
        return { ...day, trades: updatedTrades, pnl: newPnL };
      }
      return day;
    });
    setTradeData(newData);
  };


  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage theme={settings.theme} onNavigate={setCurrentPage} data={tradeData} />;
      case 'calendar':
        return (
          <>
            {isLoading && (
              <div className="p-8">
                <div className={`text-center ${settings.theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                  <p>Loading calendar data...</p>
                </div>
              </div>
            )}
            {!isLoading && (
              <CalendarPage
                tradeData={tradeData}
                currentYear={currentYear}
                currentMonth={currentMonth}
                onMonthChange={handleMonthChange}
                onUpdateTrades={handleUpdateTrades}
                theme={settings.theme}
              />
            )}
          </>
        );
      case 'dashboard':
        return <DashboardPage data={tradeData} theme={settings.theme} />;
      case 'ai-insights':
        return (
          <div className="p-8">
            <AIInsights theme={settings.theme} />
          </div>
        );
      case 'query':
        return (
          <div className="p-8">
            <QueryAssistant theme={settings.theme} />
          </div>
        );
      case 'market-events':
        return (
          <div className="p-8">
            <MarketEvents theme={settings.theme} />
          </div>
        );
      case 'trade-copier':
        return <ComingSoonPage title="Trade Copier" theme={settings.theme} />;
      case 'trading-bot':
        return <ComingSoonPage title="Trading Bot" theme={settings.theme} />;
      case 'accounts':
        return <ComingSoonPage title="Accounts" theme={settings.theme} />;
      case 'connections':
        return <ConnectionsPage theme={settings.theme} />;
      default:
        return <HomePage theme={settings.theme} onNavigate={setCurrentPage} data={tradeData} />;
    }
  };

  return (
    <div className={`flex h-screen ${settings.theme === 'dark' ? 'bg-[#1C2333]' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onShowImport={() => setShowImportModal(true)}
        onShowRules={() => setShowRulesPanel(true)}
        onShowSettings={() => setShowSettingsPanel(true)}
        theme={settings.theme}
      />

      {/* Main Content with Top Bar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className={`${settings.theme === 'dark' ? 'bg-[#252D3D] border-[#404A5F]' : 'bg-white border-gray-200'} border-b px-6 py-2 flex justify-between items-center`}>
          {/* Page Title */}
          <h1 className={`text-xl font-semibold ${settings.theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            {currentPage === 'home' && 'Welcome to Trading Hub'}
            {currentPage === 'calendar' && 'Calendar'}
            {currentPage === 'dashboard' && 'Dashboard'}
            {currentPage === 'ai-insights' && 'AI Insights'}
            {currentPage === 'query' && 'Ask AI'}
            {currentPage === 'market-events' && 'Market Events'}
            {currentPage === 'trade-copier' && 'Trade Copier'}
            {currentPage === 'trading-bot' && 'Trading Bot'}
            {currentPage === 'accounts' && 'Accounts'}
            {currentPage === 'connections' && 'Connections'}
          </h1>
          
          <ProfileMenu
            theme={settings.theme}
            onShowSettings={() => setShowSettingsPanel(true)}
            onToggleTheme={() => setSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            userName="User"
            userEmail=""
            onLogout={() => {}}
          />
        </div>

        {/* Page Content */}
        <div className={`flex-1 overflow-auto ${settings.theme === 'dark' ? 'bg-[#1C2333]' : 'bg-gray-50'}`}>
          {renderPage()}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportTrades}
          theme={settings.theme}
        />
      )}

      {/* Trading Rules Panel */}
      {showRulesPanel && (
        <TradingRulesPanel
          rules={tradingRules}
          onClose={() => setShowRulesPanel(false)}
          onUpdateRules={setTradingRules}
          theme={settings.theme}
        />
      )}

      {/* Settings Panel */}
      {showSettingsPanel && (
        <SettingsPanel
          settings={settings}
          onClose={() => setShowSettingsPanel(false)}
          onUpdateSettings={setSettings}
        />
      )}
    </div>
  );
}