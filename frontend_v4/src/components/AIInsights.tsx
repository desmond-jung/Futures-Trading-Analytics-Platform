import { Brain, TrendingDown, TrendingUp, AlertTriangle, Clock, Target, Zap } from 'lucide-react';

interface AIInsightsProps {
  theme: 'light' | 'dark';
}

export function AIInsights({ theme }: AIInsightsProps) {
  return (
    <div className="space-y-6">
      {/* Daily Summary */}
      <div className={`rounded-lg border p-6 ${
        theme === 'dark' 
          ? 'bg-[#161B22] border-[#2A2F3A]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className={`w-5 h-5 ${theme === 'dark' ? 'text-[#58A6FF]' : 'text-blue-600'}`} />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            Today's AI Summary
          </h3>
        </div>
        <div className={`p-4 rounded-lg mb-4 ${
          theme === 'dark' ? 'bg-[#0E1117]' : 'bg-gray-50'
        }`}>
          <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            You took <span className="font-semibold text-[#58A6FF]">6 trades</span> today. Your largest loss of{' '}
            <span className="font-semibold text-[#EF4444]">-$450</span> came from widening your stop after entry on /ES.
            This is the <span className="font-semibold text-[#F59E0B]">3rd time this week</span> you've moved your stop loss
            against your original plan.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg border ${
            theme === 'dark' ? 'bg-[#1F2633] border-[#2A2F3A]' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#22C55E]" />
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
                Strength
              </span>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
              Taking profits at planned targets
            </p>
          </div>
          <div className={`p-3 rounded-lg border ${
            theme === 'dark' ? 'bg-[#1F2633] border-[#2A2F3A]' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-[#EF4444]" />
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
                Area to Improve
              </span>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
              Stop loss management consistency
            </p>
          </div>
        </div>
      </div>

      {/* Pattern Detection */}
      <div className={`rounded-lg border p-6 ${
        theme === 'dark' 
          ? 'bg-[#161B22] border-[#2A2F3A]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className={`w-5 h-5 ${theme === 'dark' ? 'text-[#F59E0B]' : 'text-yellow-600'}`} />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            Detected Patterns
          </h3>
        </div>
        
        <div className="space-y-3">
          {/* Pattern 1 */}
          <div className={`p-4 rounded-lg border-l-4 border-[#EF4444] ${
            theme === 'dark' ? 'bg-[#1F2633]' : 'bg-red-50'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                  Revenge Trading Pattern
                </h4>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                theme === 'dark' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-red-200 text-red-800'
              }`}>
                High Confidence
              </span>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              After losses &gt; $200, you take another trade within 15 minutes 80% of the time with 2x position size.
              Win rate in these trades: <span className="font-semibold text-[#EF4444]">28%</span>
            </p>
            <div className="mt-2 flex gap-2">
              <span className={`text-xs px-2 py-1 rounded ${
                theme === 'dark' ? 'bg-[#0E1117] text-[#9BA4B5]' : 'bg-white text-gray-700'
              }`}>
                12 occurrences this month
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                theme === 'dark' ? 'bg-[#0E1117] text-[#9BA4B5]' : 'bg-white text-gray-700'
              }`}>
                Avg loss: -$340
              </span>
            </div>
          </div>

          {/* Pattern 2 */}
          <div className={`p-4 rounded-lg border-l-4 border-[#F59E0B] ${
            theme === 'dark' ? 'bg-[#1F2633]' : 'bg-yellow-50'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F59E0B]" />
                <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                  Time-of-Day Loss Cluster
                </h4>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                theme === 'dark' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-yellow-200 text-yellow-800'
              }`}>
                Medium Confidence
              </span>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              Trades taken between 2:00 PM - 3:00 PM have a 35% win rate vs your overall 58%.
              Possible cause: Low volume, choppy price action.
            </p>
            <div className="mt-2 flex gap-2">
              <span className={`text-xs px-2 py-1 rounded ${
                theme === 'dark' ? 'bg-[#0E1117] text-[#9BA4B5]' : 'bg-white text-gray-700'
              }`}>
                18 trades analyzed
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                theme === 'dark' ? 'bg-[#0E1117] text-[#9BA4B5]' : 'bg-white text-gray-700'
              }`}>
                P&L impact: -$1,240
              </span>
            </div>
          </div>

          {/* Pattern 3 */}
          <div className={`p-4 rounded-lg border-l-4 border-[#58A6FF] ${
            theme === 'dark' ? 'bg-[#1F2633]' : 'bg-blue-50'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#58A6FF]" />
                <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                  Stop Movement Pattern
                </h4>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                theme === 'dark' ? 'bg-[#58A6FF]/20 text-[#58A6FF]' : 'bg-blue-200 text-blue-800'
              }`}>
                High Confidence
              </span>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              When you move stops wider after entry, the trade becomes a loss 72% of the time vs 42% when stops remain unchanged.
            </p>
            <div className="mt-2 flex gap-2">
              <span className={`text-xs px-2 py-1 rounded ${
                theme === 'dark' ? 'bg-[#0E1117] text-[#9BA4B5]' : 'bg-white text-gray-700'
              }`}>
                9 occurrences this month
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                theme === 'dark' ? 'bg-[#0E1117] text-[#9BA4B5]' : 'bg-white text-gray-700'
              }`}>
                Avg loss: -$385
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Behavioral Change Detection */}
      <div className={`rounded-lg border p-6 ${
        theme === 'dark' 
          ? 'bg-[#161B22] border-[#2A2F3A]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className={`w-5 h-5 ${theme === 'dark' ? 'text-[#22C55E]' : 'text-green-600'}`} />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            Behavior Change Analysis
          </h3>
        </div>
        
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-[#0E1117]' : 'bg-gray-50'
        }`}>
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-[#F59E0B]/20' : 'bg-yellow-100'
            }`}>
              <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold text-sm mb-1 ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
                Recent Deviation Detected
              </h4>
              <p className={`text-sm ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
                Your last <span className="font-semibold">20 trades</span> differ from your profitable sample in one key way:
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={`p-3 rounded ${theme === 'dark' ? 'bg-[#1F2633]' : 'bg-white'}`}>
              <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
                Profitable Period
              </div>
              <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-[#22C55E]' : 'text-green-600'}`}>
                Entry: 9:45 AM avg
              </div>
            </div>
            <div className={`p-3 rounded ${theme === 'dark' ? 'bg-[#1F2633]' : 'bg-white'}`}>
              <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
                Last 20 Trades
              </div>
              <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-[#EF4444]' : 'text-red-600'}`}>
                Entry: 11:20 AM avg
              </div>
            </div>
          </div>

          <p className={`text-xs ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
            💡 <span className="font-medium">Insight:</span> Later entries correlate with 23% lower win rate in your history
          </p>
        </div>

        {/* Risk Tolerance Recommendation */}
        <div className={`mt-4 p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-[#1F2633] border-[#58A6FF]/30' : 'bg-blue-50 border-blue-200'
        }`}>
          <h4 className={`font-semibold text-sm mb-2 ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            📊 Recommended Position Size
          </h4>
          <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
            Based on your recent emotional state and performance metrics:
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className={`text-xs ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
                  Reduce from usual
                </span>
                <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-[#58A6FF]' : 'text-blue-600'}`}>
                  $250 → $150
                </span>
              </div>
              <div className={`h-2 rounded-full ${theme === 'dark' ? 'bg-[#0E1117]' : 'bg-gray-200'}`}>
                <div className="h-full w-[60%] bg-[#58A6FF] rounded-full"></div>
              </div>
            </div>
          </div>
          <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
            After 2+ consecutive losses, reducing risk by 40% historically improves recovery time
          </p>
        </div>
      </div>
    </div>
  );
}
