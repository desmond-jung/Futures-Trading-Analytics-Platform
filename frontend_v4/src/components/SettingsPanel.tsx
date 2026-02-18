import { X, Moon, Sun } from 'lucide-react';
import { UserSettings } from '../App';

interface SettingsPanelProps {
  settings: UserSettings;
  onClose: () => void;
  onUpdateSettings: (settings: UserSettings) => void;
}

export function SettingsPanel({ settings, onClose, onUpdateSettings }: SettingsPanelProps) {
  const theme = settings.theme;
  const bgClass = theme === 'dark' ? 'bg-[#161B22]' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600';
  const borderClass = theme === 'dark' ? 'border-[#2A2F3A]' : 'border-gray-200';
  const cardBgClass = theme === 'dark' ? 'bg-[#1F2633]' : 'bg-gray-50';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`${bgClass} rounded-xl shadow-2xl w-full max-w-md`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Setting */}
          <div>
            <label className={`block text-sm font-medium ${textClass} mb-3`}>
              Theme
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  settings.theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Sun className="w-5 h-5" />
                Light
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  settings.theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Moon className="w-5 h-5" />
                Dark
              </button>
            </div>
          </div>

          {/* Currency Setting */}
          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => onUpdateSettings({ ...settings, currency: e.target.value })}
              className={`w-full px-3 py-2 border ${borderClass} rounded ${
                theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'
              }`}
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>

          {/* Timezone Setting */}
          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => onUpdateSettings({ ...settings, timezone: e.target.value })}
              className={`w-full px-3 py-2 border ${borderClass} rounded ${
                theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'
              }`}
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
              <option value="Asia/Dubai">Dubai (GST)</option>
              <option value="Australia/Sydney">Sydney (AEDT)</option>
            </select>
          </div>

          {/* Info Box */}
          <div className={`p-4 ${cardBgClass} rounded-lg border ${borderClass}`}>
            <p className={`text-xs ${textSecondaryClass}`}>
              💡 Settings are stored locally in your browser. Connect to a backend to sync across devices.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t ${borderClass} px-6 py-4 ${cardBgClass} rounded-b-xl`}>
          <button
            onClick={onClose}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}