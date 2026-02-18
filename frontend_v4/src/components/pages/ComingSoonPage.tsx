import { Rocket, Sparkles } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  theme: 'light' | 'dark';
}

export function ComingSoonPage({ title, theme }: ComingSoonPageProps) {
  const textClass = theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600';
  const bgClass = theme === 'dark' ? 'bg-[#161B22]' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-[#1F2633]' : 'border-gray-200';

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className={`${bgClass} rounded-xl shadow-lg border ${borderClass} p-12 max-w-2xl w-full text-center`}>
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Rocket className={`w-24 h-24 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <Sparkles className={`w-8 h-8 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'} absolute -top-2 -right-2 animate-pulse`} />
          </div>
        </div>
        
        <p className={`text-xl ${textSecondaryClass} mb-6`}>
          This feature is currently under development
        </p>
        
        <div className={`${theme === 'dark' ? 'bg-[#1F2633]' : 'bg-gray-50'} rounded-lg p-6 mb-6`}>
          <p className={`text-sm ${textSecondaryClass} mb-4`}>
            We're working hard to bring you amazing new features. Here's what you can expect:
          </p>
          <ul className={`text-left space-y-2 ${textSecondaryClass} text-sm`}>
            {title === 'Trade Copier' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Copy trades in real-time across multiple accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Customizable risk management per account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Support for major brokers and platforms</span>
                </li>
              </>
            )}
            {title === 'Trading Bot' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Automated trading based on your strategies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Backtesting and optimization tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Real-time monitoring and alerts</span>
                </li>
              </>
            )}
            {title === 'Accounts' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Manage multiple trading accounts in one place</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Track performance across all accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Portfolio allocation and rebalancing</span>
                </li>
              </>
            )}
            {title === 'Connections' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Connect to popular brokers and trading platforms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Secure API integration with OAuth 2.0</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Automatic trade synchronization</span>
                </li>
              </>
            )}
          </ul>
        </div>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-[#3B82F6] text-white' : 'bg-blue-100 text-blue-700'}`}>
          <span className="font-semibold">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}