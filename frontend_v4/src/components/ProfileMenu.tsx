import { useState, useRef, useEffect } from 'react';
import { User, Settings, HelpCircle, LogOut, Moon, Sun, Bell } from 'lucide-react';

interface ProfileMenuProps {
  theme: 'light' | 'dark';
  onShowSettings: () => void;
  onToggleTheme: () => void;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export function ProfileMenu({ theme, onShowSettings, onToggleTheme, userName, userEmail, onLogout }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user initials
  const getInitials = (name?: string) => {
    if (!name) return 'JD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const bgClass = theme === 'dark' ? 'bg-[#252D3D]' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#B0B8C8]' : 'text-gray-600';
  const borderClass = theme === 'dark' ? 'border-[#404A5F]' : 'border-gray-200';
  const hoverBgClass = theme === 'dark' ? 'hover:bg-[#2E3849]' : 'hover:bg-gray-100';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${hoverBgClass}`}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
          {getInitials(userName)}
        </div>
        {/* Name & Email */}
        <div className="text-left hidden sm:block">
          <p className={`text-sm font-medium ${textClass}`}>{userName || 'John Doe'}</p>
          <p className={`text-xs ${textSecondaryClass}`}>{userEmail || 'john@example.com'}</p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-64 ${bgClass} border ${borderClass} rounded-lg shadow-xl z-50 overflow-hidden`}
        >
          {/* User Info Section */}
          <div className={`px-4 py-3 border-b ${borderClass}`}>
            <p className={`text-sm font-medium ${textClass}`}>{userName || 'John Doe'}</p>
            <p className={`text-xs ${textSecondaryClass}`}>{userEmail || 'john@example.com'}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Profile */}
            <button
              onClick={() => {
                setIsOpen(false);
                // Add profile navigation here
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${textClass} ${hoverBgClass} transition-colors`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                setIsOpen(false);
                onShowSettings();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${textClass} ${hoverBgClass} transition-colors`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>

            {/* Notifications */}
            <button
              onClick={() => {
                setIsOpen(false);
                // Add notifications handler here
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${textClass} ${hoverBgClass} transition-colors`}
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => {
                onToggleTheme();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${textClass} ${hoverBgClass} transition-colors`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  Dark Mode
                </>
              )}
            </button>

            {/* Help */}
            <button
              onClick={() => {
                setIsOpen(false);
                // Add help handler here
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${textClass} ${hoverBgClass} transition-colors`}
            >
              <HelpCircle className="w-4 h-4" />
              Help & Support
            </button>
          </div>

          {/* Logout Section */}
          <div className={`border-t ${borderClass} py-2`}>
            <button
              onClick={() => {
                setIsOpen(false);
                // Add logout handler here
                onLogout && onLogout();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 ${hoverBgClass} transition-colors`}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}