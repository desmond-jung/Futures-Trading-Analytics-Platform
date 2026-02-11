import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CalendarPage } from './components/pages/CalendarPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { HomePage } from './components/pages/HomePage';
import { ComingSoonPage } from './components/pages/ComingSoonPage';
import { ImportModal } from './components/ImportModal';
import { TradingRulesPanel } from './components/TradingRulesPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { AIInsights } from './components/AIInsights';
import { QueryAssistant } from './components/QueryAssistant';
import { MarketEvents } from './components/MarketEvents';

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
    tags: backendTrade.trade_type ? [backendTrade.trade_type] : [],
    notes: '', // Not in backend model
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
    // Don't fetch here - let useEffect handle it to avoid double-fetching
  };

  const handleImportTrades = async () => {
    // After import, refresh the data from backend
    setShowImportModal(false);
    
    // Reload current month data using the helper function
    await loadCalendarData(currentYear, currentMonth);
  };

  const handleUpdateTrades = (date: string, updatedTrades: Trade[]) => {
    const newData = tradeData.map((day: DailyPnL) => {
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
            <h1 className={`text-3xl font-bold mb-6 ${settings.theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
              AI Insights
            </h1>
            <AIInsights theme={settings.theme} />
          </div>
        );
      case 'query':
        return (
          <div className="p-8">
            <h1 className={`text-3xl font-bold mb-6 ${settings.theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
              Ask AI
            </h1>
            <QueryAssistant theme={settings.theme} />
          </div>
        );
      case 'market-events':
        return (
          <div className="p-8">
            <h1 className={`text-3xl font-bold mb-6 ${settings.theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
              Market Events
            </h1>
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
        return <ComingSoonPage title="Connections" theme={settings.theme} />;
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

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderPage()}
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