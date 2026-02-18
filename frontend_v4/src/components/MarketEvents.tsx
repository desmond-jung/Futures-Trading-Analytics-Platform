import { Calendar, TrendingUp, AlertCircle, Clock } from 'lucide-react';

interface MarketEventsProps {
  theme: 'light' | 'dark';
}

interface MacroEvent {
  date: string;
  time: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  yourPnL?: number;
  tradesCount?: number;
}

export function MarketEvents({ theme }: MarketEventsProps) {
  const upcomingEvents: MacroEvent[] = [
    {
      date: '2026-02-03',
      time: '8:30 AM',
      event: 'Non-Farm Payrolls',
      impact: 'high'
    },
    {
      date: '2026-02-05',
      time: '2:00 PM',
      event: 'FOMC Meeting',
      impact: 'high'
    },
    {
      date: '2026-02-06',
      time: '10:00 AM',
      event: 'Consumer Sentiment Index',
      impact: 'medium'
    },
    {
      date: '2026-02-07',
      time: '8:30 AM',
      event: 'Initial Jobless Claims',
      impact: 'low'
    }
  ];

  const pastEvents: MacroEvent[] = [
    {
      date: '2026-01-29',
      time: '2:00 PM',
      event: 'Fed Chair Powell Speech',
      impact: 'high',
      yourPnL: -450,
      tradesCount: 4
    },
    {
      date: '2026-01-24',
      time: '4:00 PM',
      event: 'TSLA Earnings',
      impact: 'medium',
      yourPnL: 680,
      tradesCount: 2
    },
    {
      date: '2026-01-15',
      time: '2:00 PM',
      event: 'FOMC Minutes Release',
      impact: 'high',
      yourPnL: 125,
      tradesCount: 3
    }
  ];

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'text-[#EF4444]';
    if (impact === 'medium') return 'text-[#F59E0B]';
    return 'text-[#9BA4B5]';
  };

  const getImpactBg = (impact: string) => {
    if (theme === 'dark') {
      if (impact === 'high') return 'bg-[#EF4444]/20';
      if (impact === 'medium') return 'bg-[#F59E0B]/20';
      return 'bg-[#9BA4B5]/20';
    } else {
      if (impact === 'high') return 'bg-red-100';
      if (impact === 'medium') return 'bg-yellow-100';
      return 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upcoming Events */}
      <div className={`rounded-lg border p-6 ${
        theme === 'dark' 
          ? 'bg-[#161B22] border-[#2A2F3A]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className={`w-5 h-5 ${theme === 'dark' ? 'text-[#58A6FF]' : 'text-blue-600'}`} />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            Upcoming Market Events
          </h3>
        </div>

        <div className="space-y-3">
          {upcomingEvents.map((event, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-[#1F2633] border-[#2A2F3A]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className={`w-4 h-4 ${getImpactColor(event.impact)}`} />
                    <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                      {event.event}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}>
                      📅 {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}>
                      🕐 {event.time}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded capitalize ${getImpactBg(event.impact)} ${getImpactColor(event.impact)}`}>
                  {event.impact} Impact
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past Events & Your Performance */}
      <div className={`rounded-lg border p-6 ${
        theme === 'dark' 
          ? 'bg-[#161B22] border-[#2A2F3A]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className={`w-5 h-5 ${theme === 'dark' ? 'text-[#22C55E]' : 'text-green-600'}`} />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            Recent Events & Your Performance
          </h3>
        </div>

        <div className="space-y-3">
          {pastEvents.map((event, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-[#1F2633] border-[#2A2F3A]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className={`w-4 h-4 ${getImpactColor(event.impact)}`} />
                    <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                      {event.event}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}>
                      📅 {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}>
                      🕐 {event.time}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded capitalize ${getImpactBg(event.impact)} ${getImpactColor(event.impact)}`}>
                  {event.impact} Impact
                </span>
              </div>

              {/* Performance on this day */}
              {event.yourPnL !== undefined && (
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-[#0E1117]' : 'bg-white'
                }`}>
                  <div>
                    <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
                      Your Performance
                    </div>
                    <div className={`font-semibold ${
                      event.yourPnL >= 0
                        ? theme === 'dark' ? 'text-[#22C55E]' : 'text-green-600'
                        : theme === 'dark' ? 'text-[#EF4444]' : 'text-red-600'
                    }`}>
                      {event.yourPnL >= 0 ? '+' : ''}${event.yourPnL.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
                      Trades Taken
                    </div>
                    <div className={`font-semibold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                      {event.tradesCount}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Event Performance Summary */}
      <div className={`rounded-lg border p-6 ${
        theme === 'dark' 
          ? 'bg-[#161B22] border-[#2A2F3A]' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
          Your Performance During Macro Events
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-[#1F2633]' : 'bg-gray-50'}`}>
            <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              FOMC Days
            </div>
            <div className={`text-lg font-semibold mb-1 ${theme === 'dark' ? 'text-[#22C55E]' : 'text-green-600'}`}>
              +$1,245
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              Win rate: 68% (6 events)
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-[#1F2633]' : 'bg-gray-50'}`}>
            <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              Earnings Days
            </div>
            <div className={`text-lg font-semibold mb-1 ${theme === 'dark' ? 'text-[#EF4444]' : 'text-red-600'}`}>
              -$320
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              Win rate: 42% (12 events)
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-[#1F2633]' : 'bg-gray-50'}`}>
            <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              NFP Days
            </div>
            <div className={`text-lg font-semibold mb-1 ${theme === 'dark' ? 'text-[#22C55E]' : 'text-green-600'}`}>
              +$890
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              Win rate: 71% (4 events)
            </div>
          </div>
        </div>

        <div className={`mt-4 p-4 rounded-lg ${
          theme === 'dark' ? 'bg-[#58A6FF]/10 border border-[#58A6FF]/30' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-start gap-2">
            <Clock className={`w-4 h-4 mt-0.5 ${theme === 'dark' ? 'text-[#58A6FF]' : 'text-blue-600'}`} />
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                💡 AI Insight
              </h4>
              <p className={`text-sm ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
                You perform best during scheduled volatility events (FOMC, NFP) but struggle with surprise earnings.
                Consider reducing position size by 30% on earnings days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}