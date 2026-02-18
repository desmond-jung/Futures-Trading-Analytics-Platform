import React, { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Trade } from '../App';

const API_URL = 'http://localhost:5001';

// Preset tags that users can quickly select
const PRESET_TAGS = ['ICT 22', 'Soup', 'Breakout', 'Scalp', 'Reversal', 'Trend Following', 'Mean Reversion'];

interface TradeJournalModalProps {
  trade: Trade;
  onClose: () => void;
  onUpdate: (updates: Partial<Trade>) => void;
  theme: 'light' | 'dark';
}

export function TradeJournalModal({ trade, onClose, onUpdate, theme }: TradeJournalModalProps) {
  const [tags, setTags] = useState<string[]>(trade.tags || []);
  const [notes, setNotes] = useState<string>(trade.notes || '');
  const [customTag, setCustomTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Call backend API to save tags and notes
      const response = await fetch(`${API_URL}/api/trades/${trade.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: tags,
          notes: notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save tags and notes');
      }

      const result = await response.json();
      
      // Update local state with the saved data
      onUpdate({
        tags: result.trade.tags || tags,
        notes: result.trade.notes || notes
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving tags and notes:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags([...tags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleAddPresetTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const bgClass = theme === 'dark' ? 'bg-[#161B22]' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600';
  const borderClass = theme === 'dark' ? 'border-[#2A2F3A]' : 'border-gray-200';
  const cardBgClass = theme === 'dark' ? 'bg-[#1F2633]' : 'bg-gray-50';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className={`${bgClass} rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Add Tags</h2>
            <p className="text-sm opacity-80 mt-1">{trade.symbol} - {trade.time}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Preset Tags Section */}
          <div>
            <label className={`block text-sm font-semibold ${textClass} mb-3`}>
              Preset Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_TAGS.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddPresetTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tags.includes(tag)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Tags Section */}
          <div>
            <label className={`block text-sm font-semibold ${textClass} mb-3`}>
              Custom Tags
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {tags.filter(t => !PRESET_TAGS.includes(t)).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
                placeholder="Add custom tag (e.g., Breakout, Scalp, Reversal)"
                className={`flex-1 px-3 py-2 border ${borderClass} rounded-lg ${theme === 'dark' ? 'bg-[#0E1117] text-white' : 'bg-white'}`}
              />
              <button
                onClick={handleAddCustomTag}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1e40af] transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label className={`block text-sm font-semibold ${textClass} mb-3`}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what you saw before entering this trade... Key levels, patterns, indicators, market conditions, etc."
              className={`w-full px-4 py-3 border ${borderClass} rounded-lg ${theme === 'dark' ? 'bg-[#0E1117] text-white' : 'bg-white'}`}
              rows={8}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t ${borderClass} px-6 py-4 ${cardBgClass} flex gap-3`}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-[#1E3A8A] text-white py-2.5 rounded-lg hover:bg-[#1e40af] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Tags & Notes'}
          </button>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 border ${borderClass} rounded-lg hover:${theme === 'dark' ? 'bg-[#1F2633]' : 'bg-gray-100'} transition-colors font-medium ${textClass}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
