import { useState } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { TradingRule } from '../App';

interface TradingRulesPanelProps {
  rules: TradingRule[];
  onClose: () => void;
  onUpdateRules: (rules: TradingRule[]) => void;
  theme: 'light' | 'dark';
}

export function TradingRulesPanel({ rules, onClose, onUpdateRules, theme }: TradingRulesPanelProps) {
  const [localRules, setLocalRules] = useState(rules);
  const [newRule, setNewRule] = useState({ title: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddRule = () => {
    if (!newRule.title || !newRule.description) {
      alert('Please fill in both title and description');
      return;
    }

    const rule: TradingRule = {
      id: Date.now().toString(),
      title: newRule.title,
      description: newRule.description,
      enabled: true
    };

    const updated = [...localRules, rule];
    setLocalRules(updated);
    onUpdateRules(updated);
    setNewRule({ title: '', description: '' });
    setShowAddForm(false);
  };

  const handleToggleRule = (id: string) => {
    const updated = localRules.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    );
    setLocalRules(updated);
    onUpdateRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      const updated = localRules.filter(rule => rule.id !== id);
      setLocalRules(updated);
      onUpdateRules(updated);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-[#161B22]' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600';
  const borderClass = theme === 'dark' ? 'border-[#2A2F3A]' : 'border-gray-200';
  const cardBgClass = theme === 'dark' ? 'bg-[#1F2633]' : 'bg-gray-50';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`${bgClass} rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Trading Rules</h2>
            <p className="text-sm text-green-100 mt-1">Set and follow your trading strategy guidelines</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Add New Rule Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-4 py-3 border-2 border-dashed border-gray-400 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Rule
            </button>
          )}

          {/* Add Rule Form */}
          {showAddForm && (
            <div className={`${cardBgClass} rounded-lg border ${borderClass} p-4 mb-4`}>
              <h3 className={`font-semibold ${textClass} mb-3`}>New Trading Rule</h3>
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium ${textSecondaryClass} mb-1`}>
                    Rule Title
                  </label>
                  <input
                    type="text"
                    value={newRule.title}
                    onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                    placeholder="e.g., Wait for confirmation"
                    className={`w-full px-3 py-2 border ${borderClass} rounded ${
                      theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textSecondaryClass} mb-1`}>
                    Description
                  </label>
                  <textarea
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    placeholder="Describe the rule in detail..."
                    className={`w-full px-3 py-2 border ${borderClass} rounded ${
                      theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'
                    }`}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddRule}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Add Rule
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewRule({ title: '', description: '' });
                    }}
                    className={`px-4 py-2 border ${borderClass} rounded hover:${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    } transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rules List */}
          <div className="space-y-3">
            {localRules.map((rule) => (
              <div
                key={rule.id}
                className={`${cardBgClass} rounded-lg border ${borderClass} p-4 ${
                  !rule.enabled ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        rule.enabled
                          ? 'bg-green-600 border-green-600'
                          : theme === 'dark'
                          ? 'border-gray-600 hover:border-gray-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {rule.enabled && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${textClass} mb-1`}>{rule.title}</h4>
                      <p className={`text-sm ${textSecondaryClass}`}>{rule.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="ml-2 p-1.5 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {localRules.length === 0 && !showAddForm && (
            <div className="text-center py-12">
              <p className={textSecondaryClass}>No trading rules yet. Add your first rule to get started!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t ${borderClass} px-6 py-4 ${cardBgClass}`}>
          <div className={`text-sm ${textSecondaryClass} mb-3`}>
            <strong className={textClass}>{localRules.filter(r => r.enabled).length}</strong> of{' '}
            <strong className={textClass}>{localRules.length}</strong> rules active
          </div>
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}