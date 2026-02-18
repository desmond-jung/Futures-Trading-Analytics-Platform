import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Pencil, Check, Plus } from 'lucide-react';
import { DailyPnL, Trade } from '../App';
import { TradeJournalModal } from './TradeJournalModal';

interface TradeDetailModalProps {
  dailyData: DailyPnL;
  onClose: () => void;
  onUpdateTrades: (trades: Trade[]) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  theme: 'light' | 'dark';
}

type TabType = 'overview' | 'trades';

export function TradeDetailModal({ dailyData, onClose, onUpdateTrades, onNavigate, theme }: TradeDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [journalTrade, setJournalTrade] = useState<Trade | null>(null);
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [showTagDropdown, setShowTagDropdown] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [editedNotes, setEditedNotes] = useState<{ [key: string]: string }>({});
  const [localTrades, setLocalTrades] = useState<Trade[]>(dailyData.trades);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Sync local trades with props when dailyData changes
  useEffect(() => {
    setLocalTrades(dailyData.trades);
  }, [dailyData.trades]);

  const predefinedTags = ['ICT', 'Soup', 'S/R Flip', 'Breakout', 'Reversal', 'Scalp', 'Swing'];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedButton = Object.values(buttonRefs.current).some(ref => ref?.contains(event.target as Node));
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && !clickedButton) {
        setShowTagDropdown(null);
        setShowCustomTagInput(false);
        setCustomTagInput('');
      }
    };

    if (showTagDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagDropdown]);

  const trades = localTrades;
  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winningTrades = trades.filter(t => t.pnl > 0).length;
  const losingTrades = trades.filter(t => t.pnl < 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  
  // Get unique strategies
  const strategies = Array.from(new Set(trades.flatMap(t => t.tags)));
  
  // Calculate average win/loss
  const avgWin = winningTrades > 0 
    ? trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / winningTrades 
    : 0;
  const avgLoss = losingTrades > 0
    ? trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / losingTrades
    : 0;

  const handleUpdateTrade = (tradeId: string, updates: Partial<Trade>) => {
    const updatedTrades = trades.map(trade => {
      if (trade.id === tradeId) {
        return { ...trade, ...updates };
      }
      return trade;
    });
    setLocalTrades(updatedTrades);
    onUpdateTrades(updatedTrades);
  };

  const bgClass = theme === 'dark' ? 'bg-[#252D3D]' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#B0B8C8]' : 'text-gray-600';
  const borderClass = theme === 'dark' ? 'border-[#404A5F]' : 'border-gray-200';
  const cardBgClass = theme === 'dark' ? 'bg-[#2E3849]' : 'bg-gray-50';

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className={`${bgClass} rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}>
          {/* Header */}
          <div className={`${cardBgClass} px-6 py-4`}>
            <div className="flex items-center justify-between">
              {/* Left Arrow */}
              <button
                onClick={() => onNavigate?.('prev')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-[#404A5F] text-[#B0B8C8]' : 'hover:bg-gray-200 text-gray-600'
                }`}
                disabled={!onNavigate}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Centered Date */}
              <div className="text-center">
                <h2 className={`text-2xl font-bold ${textClass}`}>
                  {new Date(dailyData.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
              </div>

              {/* Right Arrow and Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate?.('next')}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-[#404A5F] text-[#B0B8C8]' : 'hover:bg-gray-200 text-gray-600'
                  }`}
                  disabled={!onNavigate}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-[#404A5F] text-[#B0B8C8]' : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex gap-4 mt-4 border-b ${borderClass}`}>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'overview'
                    ? `border-b-2 border-[#1E3A8A] ${textClass}`
                    : `${textSecondaryClass} hover:${textClass}`
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('trades')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'trades'
                    ? `border-b-2 border-[#1E3A8A] ${textClass}`
                    : `${textSecondaryClass} hover:${textClass}`
                }`}
              >
                Trades
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'overview' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* P&L Card */}
                <div className={`${cardBgClass} rounded-lg border ${borderClass} p-4`}>
                  <p className={`text-sm ${textSecondaryClass} mb-2`}>Total P&L</p>
                  <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                  </p>
                </div>

                {/* Number of Trades */}
                <div className={`${cardBgClass} rounded-lg border ${borderClass} p-4`}>
                  <p className={`text-sm ${textSecondaryClass} mb-2`}>Total Trades</p>
                  <p className={`text-2xl font-bold ${textClass}`}>{trades.length}</p>
                  <p className={`text-xs ${textSecondaryClass} mt-1`}>
                    {winningTrades}W / {losingTrades}L
                  </p>
                </div>

                {/* Win Rate */}
                <div className={`${cardBgClass} rounded-lg border ${borderClass} p-4`}>
                  <p className={`text-sm ${textSecondaryClass} mb-2`}>Win Rate</p>
                  <p className={`text-2xl font-bold ${textClass}`}>{winRate.toFixed(1)}%</p>
                </div>

                {/* Average Win */}
                <div className={`${cardBgClass} rounded-lg border ${borderClass} p-4`}>
                  <p className={`text-sm ${textSecondaryClass} mb-2`}>Avg Win</p>
                  <p className={`text-2xl font-bold text-[#22C55E]`}>
                    +${avgWin.toFixed(2)}
                  </p>
                </div>

                {/* Average Loss */}
                <div className={`${cardBgClass} rounded-lg border ${borderClass} p-4`}>
                  <p className={`text-sm ${textSecondaryClass} mb-2`}>Avg Loss</p>
                  <p className={`text-2xl font-bold text-[#EF4444]`}>
                    ${avgLoss.toFixed(2)}
                  </p>
                </div>

                {/* Profit Factor */}
                <div className={`${cardBgClass} rounded-lg border ${borderClass} p-4`}>
                  <p className={`text-sm ${textSecondaryClass} mb-2`}>Profit Factor</p>
                  <p className={`text-2xl font-bold ${textClass}`}>
                    {avgLoss !== 0 ? (Math.abs(avgWin * winningTrades) / Math.abs(avgLoss * losingTrades)).toFixed(2) : 'N/A'}
                  </p>
                </div>

                {/* Largest Win */}
                <div className={`${cardBgClass} rounded-lg border ${borderClass} p-4`}>
                  <p className={`text-sm ${textSecondaryClass} mb-2`}>Largest Win</p>
                  <p className={`text-2xl font-bold text-[#22C55E]`}>
                    +${Math.max(...trades.map(t => t.pnl), 0).toFixed(2)}
                  </p>
                </div>

                {/* Largest Loss */}
                <div className={`${cardBgClass} rounded-lg border ${borderClass} p-4`}>
                  <p className={`text-sm ${textSecondaryClass} mb-2`}>Largest Loss</p>
                  <p className={`text-2xl font-bold text-[#EF4444]`}>
                    ${Math.min(...trades.map(t => t.pnl), 0).toFixed(2)}
                  </p>
                </div>

                {/* Strategies Used - Full Width */}
                <div className={`${cardBgClass} rounded-lg border ${borderClass} p-4 col-span-2 md:col-span-4`}>
                  <p className={`text-sm ${textSecondaryClass} mb-3`}>Strategies Used</p>
                  <div className="flex flex-wrap gap-2">
                    {strategies.length > 0 ? (
                      strategies.map((strategy, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                        >
                          {strategy}
                        </span>
                      ))
                    ) : (
                      <span className={textSecondaryClass}>No strategies tagged</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Trades Tab - Table View */
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className={`border-b ${borderClass}`}>
                      <th className={`text-left py-3 px-3 text-sm font-semibold ${textSecondaryClass} whitespace-nowrap`}>Date/Time</th>
                      <th className={`text-left py-3 px-3 text-sm font-semibold ${textSecondaryClass} whitespace-nowrap`}>Account</th>
                      <th className={`text-left py-3 px-3 text-sm font-semibold ${textSecondaryClass} whitespace-nowrap`}>Symbol</th>
                      <th className={`text-right py-3 px-3 text-sm font-semibold ${textSecondaryClass} whitespace-nowrap`}>Qty</th>
                      <th className={`text-right py-3 px-3 text-sm font-semibold ${textSecondaryClass} whitespace-nowrap`}>P&L</th>
                      <th className={`text-right py-3 px-3 text-sm font-semibold ${textSecondaryClass} whitespace-nowrap`}>Duration</th>
                      <th className={`text-left py-3 px-3 text-sm font-semibold ${textSecondaryClass} whitespace-nowrap`}>Tags</th>
                      <th className={`text-left py-3 px-3 text-sm font-semibold ${textSecondaryClass} whitespace-nowrap`}>Notes</th>
                      <th className={`text-center py-3 px-3 text-sm font-semibold ${textSecondaryClass} whitespace-nowrap`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const isEditing = editingTradeId === trade.id;
                      // Format date without year
                      const tradeDate = new Date(trade.date);
                      const formattedDate = tradeDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                      
                      return (
                        <tr key={trade.id} className={`border-b ${borderClass} hover:${cardBgClass} transition-colors`}>
                          <td className={`py-3 px-3 text-sm ${textClass} whitespace-nowrap`}>
                            {formattedDate} {trade.time}
                          </td>
                          <td className={`py-3 px-3 text-sm ${textSecondaryClass} whitespace-nowrap`}>
                            {trade.account || 'N/A'}
                          </td>
                          <td className={`py-3 px-3 text-sm font-semibold ${textClass} whitespace-nowrap`}>
                            {trade.symbol}
                          </td>
                          <td className={`py-3 px-3 text-sm text-right ${textClass} whitespace-nowrap`}>
                            {trade.quantity}
                          </td>
                          <td className={`py-3 px-3 text-sm text-right font-semibold whitespace-nowrap ${
                            trade.pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                          }`}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </td>
                          <td className={`py-3 px-3 text-sm text-right ${textSecondaryClass} whitespace-nowrap`}>
                            {trade.duration ? `${trade.duration}m` : 'N/A'}
                          </td>
                          
                          {/* Tags Column */}
                          <td className="py-3 px-3 min-w-[180px] max-w-[250px]">
                            {isEditing ? (
                              <div className="relative">
                                {/* Display tags with click to open dropdown */}
                                <div
                                  ref={(el) => { buttonRefs.current[trade.id] = el; }}
                                  onClick={() => setShowTagDropdown(showTagDropdown === trade.id ? null : trade.id)}
                                  className={`w-full px-3 py-2 text-left text-sm border ${borderClass} rounded-lg ${theme === 'dark' ? 'bg-[#2E3849] text-[#E6EDF3]' : 'bg-white text-gray-900'} hover:${cardBgClass} transition-colors cursor-pointer min-h-[40px] flex items-center`}
                                >
                                  {trade.tags && trade.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {trade.tags.map((tag, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                                        >
                                          {tag}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleUpdateTrade(trade.id, {
                                                tags: trade.tags?.filter((_, i) => i !== idx)
                                              });
                                            }}
                                            className="hover:text-blue-900"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className={textSecondaryClass}>Add tags...</span>
                                  )}
                                </div>
                                
                                {showTagDropdown === trade.id && buttonRefs.current[trade.id] && (
                                  <div className={`fixed z-[60] mt-1 w-64 ${bgClass} border ${borderClass} rounded-lg shadow-lg max-h-60 overflow-auto`} ref={dropdownRef}
                                    style={{
                                      top: `${buttonRefs.current[trade.id]!.getBoundingClientRect().bottom + 4}px`,
                                      left: `${buttonRefs.current[trade.id]!.getBoundingClientRect().left}px`
                                    }}
                                  >
                                    {/* Custom Tag Input */}
                                    <div className={`p-2`}>
                                      {showCustomTagInput ? (
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={customTagInput}
                                            onChange={(e) => setCustomTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && customTagInput.trim()) {
                                                handleUpdateTrade(trade.id, {
                                                  tags: [...(trade.tags || []), customTagInput.trim()]
                                                });
                                                setCustomTagInput('');
                                                setShowCustomTagInput(false);
                                                setShowTagDropdown(null);
                                              }
                                            }}
                                            placeholder="Type tag name..."
                                            className={`flex-1 px-2 py-1 text-sm border ${borderClass} rounded ${theme === 'dark' ? 'bg-[#2E3849] text-[#E6EDF3]' : 'bg-white text-gray-900'}`}
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => {
                                              if (customTagInput.trim()) {
                                                handleUpdateTrade(trade.id, {
                                                  tags: [...(trade.tags || []), customTagInput.trim()]
                                                });
                                                setCustomTagInput('');
                                                setShowCustomTagInput(false);
                                                setShowTagDropdown(null);
                                              }
                                            }}
                                            className="px-2 py-1 bg-[#1E3A8A] text-white rounded hover:bg-[#1e40af] transition-colors"
                                          >
                                            <Check className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setShowCustomTagInput(true)}
                                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${textClass} hover:${cardBgClass} rounded transition-colors`}
                                        >
                                          <Plus className="w-4 h-4" />
                                          Add Custom Tag
                                        </button>
                                      )}
                                    </div>
                                    
                                    {/* Predefined Tags */}
                                    <div className={`p-2 border-t ${borderClass}`}>
                                      <p className={`text-xs ${textSecondaryClass} mb-2 font-semibold`}>Predefined Tags</p>
                                      {predefinedTags.map((tag) => (
                                        <button
                                          key={tag}
                                          onClick={() => {
                                            if (!trade.tags?.includes(tag)) {
                                              handleUpdateTrade(trade.id, {
                                                tags: [...(trade.tags || []), tag]
                                              });
                                              setShowTagDropdown(null);
                                            }
                                          }}
                                          className={`w-full text-left px-3 py-2 text-sm ${textClass} hover:${cardBgClass} rounded transition-colors ${
                                            trade.tags?.includes(tag) ? 'opacity-50 cursor-not-allowed' : ''
                                          }`}
                                          disabled={trade.tags?.includes(tag)}
                                        >
                                          {tag}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {trade.tags && trade.tags.length > 0 ? (
                                  trade.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium whitespace-nowrap"
                                    >
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className={`text-xs ${textSecondaryClass}`}>No tags</span>
                                )}
                              </div>
                            )}
                          </td>
                          
                          {/* Notes Column */}
                          <td className="py-3 px-3 min-w-[200px] max-w-[300px]">
                            {isEditing ? (
                              <textarea
                                value={editedNotes[trade.id] !== undefined ? editedNotes[trade.id] : (trade.notes || '')}
                                onChange={(e) => setEditedNotes({ ...editedNotes, [trade.id]: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                onInput={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                placeholder="Add notes..."
                                className={`w-full px-3 py-2 text-sm border ${borderClass} rounded-lg ${theme === 'dark' ? 'bg-[#2E3849] text-[#E6EDF3]' : 'bg-white text-gray-900'} resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]`}
                                rows={2}
                              />
                            ) : (
                              <p className={`text-sm ${(editedNotes[trade.id] !== undefined ? editedNotes[trade.id] : trade.notes) ? textClass : textSecondaryClass} line-clamp-2`}>
                                {editedNotes[trade.id] !== undefined ? editedNotes[trade.id] || 'No notes' : (trade.notes || 'No notes')}
                              </p>
                            )}
                          </td>
                          
                          {/* Edit Button */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (isEditing) {
                                  setEditingTradeId(null);
                                  setShowTagDropdown(null);
                                  setShowCustomTagInput(false);
                                  setCustomTagInput('');
                                  if (editedNotes[trade.id]) {
                                    handleUpdateTrade(trade.id, { notes: editedNotes[trade.id] });
                                  }
                                } else {
                                  setEditingTradeId(trade.id);
                                }
                              }}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 ${
                                isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1E3A8A] hover:bg-[#1e40af]'
                              } text-white rounded-lg transition-colors text-xs font-medium`}
                            >
                              {isEditing ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Save
                                </>
                              ) : (
                                <>
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`border-t ${borderClass} px-6 py-4 ${cardBgClass}`}>
            <button
              onClick={onClose}
              className="w-full bg-[#1E3A8A] text-white py-2.5 rounded-lg hover:bg-[#1e40af] transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Journal Modal */}
      {journalTrade && (
        <TradeJournalModal
          trade={journalTrade}
          onClose={() => setJournalTrade(null)}
          onUpdate={(updates) => {
            handleUpdateTrade(journalTrade.id, updates);
            setJournalTrade(null);
          }}
          theme={theme}
        />
      )}
    </>
  );
}