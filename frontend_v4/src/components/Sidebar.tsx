import { Home, Calendar, BarChart3, Copy, Bot, Users, Link, Upload, BookOpen, Settings, Brain, MessageSquare, CalendarClock } from 'lucide-react';
import { PageType } from '../App';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  onShowImport: () => void;
  onShowRules: () => void;
  onShowSettings: () => void;
  theme: 'light' | 'dark';
}

export function Sidebar({ currentPage, onNavigate, onShowImport, onShowRules, onShowSettings, theme }: SidebarProps) {
  const navItems: { id: PageType; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'ai-insights', label: 'AI Insights', icon: Brain },
    { id: 'query', label: 'Ask AI', icon: MessageSquare },
    { id: 'market-events', label: 'Market Events', icon: CalendarClock },
    { id: 'trade-copier', label: 'Trade Copier', icon: Copy },
    { id: 'trading-bot', label: 'Trading Bot', icon: Bot },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'connections', label: 'Connections', icon: Link },
  ];

  const bgClass = theme === 'dark' ? 'bg-[#252D3D]' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-[#404A5F]' : 'border-gray-200';
  const textClass = theme === 'dark' ? 'text-[#B0B8C8]' : 'text-gray-700';
  const activeClass = theme === 'dark' ? 'bg-[#2E3849] text-[#E6EDF3] border-l-4 border-l-[#3B82F6]' : 'bg-blue-100 text-blue-700';
  const hoverClass = theme === 'dark' ? 'hover:bg-[#2E3849]' : 'hover:bg-gray-100';

  return (
    <div className={`w-64 ${bgClass} border-r ${borderClass} flex flex-col`}>
      {/* Logo/Header */}
      <div className={`p-6 border-b ${borderClass}`}>
        <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
          Trading Hub
        </h1>
        <p className={`text-xs ${theme === 'dark' ? 'text-[#B0B8C8]' : 'text-gray-600'} mt-1`}>
          Analytics Platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? activeClass : `${textClass} ${hoverClass}`
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className={`p-4 border-t ${borderClass} space-y-1 ${theme === 'dark' ? 'bg-[#252D3D]' : 'bg-white'}`}>
        <button
          onClick={onShowImport}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${textClass} ${hoverClass}`}
        >
          <Upload className="w-5 h-5" />
          <span className="font-medium">Import Trades</span>
        </button>
        <button
          onClick={onShowRules}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${textClass} ${hoverClass}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="font-medium">Trading Rules</span>
        </button>
        <button
          onClick={onShowSettings}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${textClass} ${hoverClass}`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}