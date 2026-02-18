import { useState } from 'react';
import { TradeCalendar } from '../TradeCalendar';
import { TradeDetailModal } from '../TradeDetailModal';
import { DailyPnL, Trade } from '../../App';

interface CalendarPageProps {
  tradeData: DailyPnL[];
  currentYear: number;
  currentMonth: number;
  onMonthChange: (year: number, month: number) => void;
  onUpdateTrades: (date: string, trades: Trade[]) => void;
  theme: 'light' | 'dark';
}

export function CalendarPage({
  tradeData,
  currentYear,
  currentMonth,
  onMonthChange,
  onUpdateTrades,
  theme
}: CalendarPageProps) {
  const [selectedDate, setSelectedDate] = useState<DailyPnL | null>(null);

  const textClass = theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600';

  // Get all dates with trades, sorted chronologically
  const datesWithTrades = tradeData
    .filter(day => day.trades.length > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Navigate to previous/next date with trades
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;
    
    const currentIndex = datesWithTrades.findIndex(day => day.date === selectedDate.date);
    if (currentIndex === -1) return;

    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < datesWithTrades.length) {
      setSelectedDate(datesWithTrades[newIndex]);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Calendar */}
      <TradeCalendar
        data={tradeData}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onDateClick={setSelectedDate}
        onMonthChange={onMonthChange}
        theme={theme}
      />

      {/* Trade Detail Modal */}
      {selectedDate && (
        <TradeDetailModal
          dailyData={selectedDate}
          onClose={() => setSelectedDate(null)}
          onUpdateTrades={(updatedTrades) => onUpdateTrades(selectedDate.date, updatedTrades)}
          theme={theme}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}