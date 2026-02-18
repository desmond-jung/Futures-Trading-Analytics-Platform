import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyPnL } from '../App';
import React from 'react';

interface TradeCalendarProps {
  data: DailyPnL[];
  currentYear: number;
  currentMonth: number;
  onDateClick: (dailyData: DailyPnL) => void;
  onMonthChange: (year: number, month: number) => void;
  theme: 'light' | 'dark';
}

export function TradeCalendar({ data, currentYear, currentMonth, onDateClick, onMonthChange, theme }: TradeCalendarProps) {
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Weekly'];
  
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate monthly PnL
  const monthlyPnL = data
    .filter(d => {
      const [year, month] = d.date.split('-').map(Number);
      return year === currentYear && month === currentMonth;
    })
    .reduce((sum, d) => sum + d.pnl, 0);

  // Calculate weekly aggregates
  const getWeekOfMonth = (day: number) => {
    const date = new Date(currentYear, currentMonth - 1, day);
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    return Math.ceil((day + dayOfWeek) / 7);
  };

  const calculateWeeklyData = (weekNum: number) => {
    const weekDays: DailyPnL[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (getWeekOfMonth(day) === weekNum) {
        const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dailyData = data.find(d => d.date === dateStr);
        if (dailyData) weekDays.push(dailyData);
      }
    }
    const totalPnL = weekDays.reduce((sum, d) => sum + d.pnl, 0);
    const totalTrades = weekDays.reduce((sum, d) => sum + d.trades.length, 0);
    return { pnl: totalPnL, trades: totalTrades, weekNum };
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return theme === 'dark' ? 'text-[#22C55E]' : 'text-green-600';
    if (pnl < 0) return theme === 'dark' ? 'text-[#EF4444]' : 'text-red-600';
    return theme === 'dark' ? 'text-[#B0B8C8]' : 'text-gray-600';
  };

  const getBorderColor = (pnl: number) => {
    if (pnl > 0) return theme === 'dark' ? 'border-[#22C55E]/30' : 'border-green-300';
    if (pnl < 0) return theme === 'dark' ? 'border-[#EF4444]/30' : 'border-red-300';
    return theme === 'dark' ? 'border-[#404A5F]' : 'border-gray-200';
  };

  const getBackgroundColor = (pnl: number) => {
    if (pnl > 0) return theme === 'dark' ? 'bg-[#22C55E]/5 hover:bg-[#22C55E]/10' : 'bg-green-50 hover:bg-green-100';
    if (pnl < 0) return theme === 'dark' ? 'bg-[#EF4444]/5 hover:bg-[#EF4444]/10' : 'bg-red-50 hover:bg-red-100';
    return theme === 'dark' ? 'bg-[#2E3849]/30 hover:bg-[#2E3849]/50' : 'bg-gray-50 hover:bg-gray-100';
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(currentYear - 1, 12);
    } else {
      onMonthChange(currentYear, currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(currentYear + 1, 1);
    } else {
      onMonthChange(currentYear, currentMonth + 1);
    }
  };

  // Calculate number of weeks in month
  const numWeeks = getWeekOfMonth(daysInMonth);

  return (
    <>
      {/* Monthly P/L Header */}
      <div className={`text-center mb-6 p-4 rounded-lg border ${
        theme === 'dark' 
          ? 'bg-[#252D3D] border-[#404A5F]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className={`text-sm mb-1 ${theme === 'dark' ? 'text-[#B0B8C8]' : 'text-gray-600'}`}>
          Monthly P/L:
        </div>
        <div className={`text-2xl font-bold ${getPnLColor(monthlyPnL)}`}>
          {monthlyPnL >= 0 ? '+' : ''}${monthlyPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Calendar Card */}
      <div className={`rounded-lg shadow-sm border p-6 ${
        theme === 'dark' 
          ? 'bg-[#252D3D] border-[#404A5F]' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handlePrevMonth}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-[#2E3849] text-[#B0B8C8]'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className={`text-base font-medium ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            {monthNames[currentMonth - 1]} {currentYear}
          </h3>
          <button
            onClick={handleNextMonth}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-[#2E3849] text-[#B0B8C8]'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const today = new Date();
              onMonthChange(today.getFullYear(), today.getMonth() + 1);
            }}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              theme === 'dark'
                ? 'bg-[#2E3849] text-[#E6EDF3] hover:bg-[#404A5F]'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {daysOfWeek.map(day => (
            <div key={day} className={`text-center font-medium text-xs py-2 ${
              theme === 'dark' ? 'text-[#B0B8C8]' : 'text-gray-600'
            }`}>
              {day}
            </div>
          ))}
          
          {/* Calendar days - organized by week rows */}
          {Array.from({ length: numWeeks }).map((_, weekIndex) => {
            const weekNum = weekIndex + 1;
            const weeklyData = calculateWeeklyData(weekNum);
            
            return (
              <React.Fragment key={`week-${weekNum}`}>
                {/* Days of the week (Sun-Fri) */}
                {Array.from({ length: 6 }).map((_, dayOfWeek) => {
                  // Calculate which day of month this is
                  let day: number | null = null;
                  
                  for (let d = 1; d <= daysInMonth; d++) {
                    const date = new Date(currentYear, currentMonth - 1, d);
                    if (date.getDay() === dayOfWeek && getWeekOfMonth(d) === weekNum) {
                      day = d;
                      break;
                    }
                  }
                  
                  if (day === null) {
                    // Empty cell
                    return (
                      <div
                        key={`empty-${weekNum}-${dayOfWeek}`}
                        className={`aspect-square border rounded-lg ${
                          theme === 'dark' ? 'border-[#404A5F]' : 'border-gray-200'
                        }`}
                      />
                    );
                  }
                  
                  const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const dailyData = data.find(d => d.date === dateStr);
                  const pnl = dailyData?.pnl || 0;
                  
                  return (
                    <button
                      key={day}
                      onClick={() => dailyData && onDateClick(dailyData)}
                      disabled={!dailyData}
                      className={`aspect-square border rounded-lg p-2 flex flex-col transition-all ${
                        getBorderColor(pnl)
                      } ${
                        getBackgroundColor(pnl)
                      } ${
                        !dailyData ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <span className={`text-xs ${theme === 'dark' ? 'text-[#B0B8C8]' : 'text-gray-500'}`}>
                        {day}
                      </span>
                      <div className="flex-1 flex flex-col items-center justify-center">
                        {dailyData && (
                          <>
                            <span className={`text-sm font-semibold ${getPnLColor(pnl)}`}>
                              {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-[#B0B8C8]' : 'text-gray-500'}`}>
                              {dailyData.trades.length} trade{dailyData.trades.length !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
                
                {/* Weekly aggregate column */}
                <div
                  className={`aspect-square border rounded-lg p-2 flex flex-col ${
                    getBorderColor(weeklyData.pnl)
                  } ${
                    getBackgroundColor(weeklyData.pnl)
                  }`}
                >
                  <span className={`text-xs ${theme === 'dark' ? 'text-[#B0B8C8]' : 'text-gray-500'}`}>
                    Week {weekNum}
                  </span>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <span className={`text-sm font-semibold ${getPnLColor(weeklyData.pnl)}`}>
                      {weeklyData.pnl >= 0 ? '+' : ''}${Math.abs(weeklyData.pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-[#B0B8C8]' : 'text-gray-500'}`}>
                      {weeklyData.trades} trade{weeklyData.trades !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}