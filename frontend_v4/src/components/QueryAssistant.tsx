import { Send, MessageSquare, TrendingDown, Clock, DollarSign, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface QueryAssistantProps {
  theme: 'light' | 'dark';
}

interface Message {
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export function QueryAssistant({ theme }: QueryAssistantProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      text: "Hi! I'm your trading assistant. Ask me anything about your trading history, patterns, or performance. Try questions like 'Why did I lose money last Tuesday?' or 'What's my best performing strategy?'",
      timestamp: '10:30 AM'
    }
  ]);

  // Example suggested queries
  const suggestedQueries = [
    "Why did I lose money last Tuesday?",
    "What's my win rate for momentum trades?",
    "Show me my performance after FOMC announcements",
    "How do I perform on Mondays vs Fridays?",
    "What was my biggest drawdown last month?",
    "When do I take my most profitable trades?"
  ];

  const handleSendQuery = () => {
    if (!query.trim()) return;

    // Add user message
    const userMessage: Message = {
      type: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };

    // Simulate AI response
    const aiResponse: Message = {
      type: 'ai',
      text: getExampleResponse(query),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };

    setMessages([...messages, userMessage, aiResponse]);
    setQuery('');
  };

  const getExampleResponse = (question: string): string => {
    if (question.toLowerCase().includes('tuesday') || question.toLowerCase().includes('lose money')) {
      return "Last Tuesday (Jan 28), you had a net loss of -$680 across 5 trades. The primary issue was taking 3 trades between 2:15-2:45 PM, all against the trend after two earlier losses. Your first loss was $180 on /NQ at 10:30 AM, followed by a $220 revenge trade on the same symbol 12 minutes later with 2x size. The afternoon cluster had a combined loss of $280, all taken during low-volume choppy conditions.";
    }
    if (question.toLowerCase().includes('momentum')) {
      return "Your momentum strategy has a 64% win rate over 143 trades with an average profit of +$285 per trade. Best performance is seen between 9:30-10:30 AM (73% win rate). Position sizes between $200-$350 show optimal results. Win rate drops to 51% when entering after 11:00 AM.";
    }
    return "I've analyzed your trading history. This feature is coming soon and will provide detailed insights based on your question. For now, this is a placeholder response demonstrating the natural language query capability.";
  };

  return (
    <div className="space-y-4">
      {/* Suggested Queries */}
      <div className={`rounded-lg border p-4 ${
        theme === 'dark' 
          ? 'bg-[#161B22] border-[#2A2F3A]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className={`w-4 h-4 ${theme === 'dark' ? 'text-[#F59E0B]' : 'text-yellow-600'}`} />
          <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            Try asking:
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQueries.map((suggested, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(suggested)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-[#1F2633] text-[#58A6FF] hover:bg-[#2A2F3A] border border-[#2A2F3A]'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              {suggested}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className={`rounded-lg border p-4 min-h-[500px] max-h-[600px] overflow-y-auto ${
        theme === 'dark' 
          ? 'bg-[#161B22] border-[#2A2F3A]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="space-y-4">
          {messages.map((message, idx) => (
            <div key={idx} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-center gap-2 mb-1 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'ai' && (
                    <MessageSquare className={`w-4 h-4 ${theme === 'dark' ? 'text-[#58A6FF]' : 'text-blue-600'}`} />
                  )}
                  <span className={`text-xs ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
                    {message.type === 'ai' ? 'AI Assistant' : 'You'} • {message.timestamp}
                  </span>
                </div>
                <div className={`p-3 rounded-lg ${
                  message.type === 'user'
                    ? theme === 'dark'
                      ? 'bg-[#58A6FF] text-white'
                      : 'bg-blue-600 text-white'
                    : theme === 'dark'
                      ? 'bg-[#1F2633] text-[#E6EDF3]'
                      : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className={`rounded-lg border p-4 ${
        theme === 'dark' 
          ? 'bg-[#161B22] border-[#2A2F3A]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder="Ask anything about your trading..."
            className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#58A6FF] ${
              theme === 'dark'
                ? 'bg-[#0E1117] border-[#2A2F3A] text-[#E6EDF3] placeholder-[#9BA4B5]'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          <button
            onClick={handleSendQuery}
            className={`px-4 py-2 rounded-lg transition-all hover:scale-105 ${
              theme === 'dark'
                ? 'bg-[#58A6FF] text-white hover:bg-[#4A8FE7]'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
          💡 This is a placeholder UI. AI integration coming soon with your Python backend.
        </p>
      </div>

      {/* Quick Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-lg border p-4 ${
          theme === 'dark' 
            ? 'bg-[#161B22] border-[#2A2F3A]' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-[#EF4444]" />
            <span className={`text-xs ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              Worst Day This Month
            </span>
          </div>
          <div className={`text-lg font-semibold text-[#EF4444]`}>
            Jan 28 (-$680)
          </div>
        </div>

        <div className={`rounded-lg border p-4 ${
          theme === 'dark' 
            ? 'bg-[#161B22] border-[#2A2F3A]' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#58A6FF]" />
            <span className={`text-xs ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              Best Time Window
            </span>
          </div>
          <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            9:30-10:30 AM
          </div>
        </div>

        <div className={`rounded-lg border p-4 ${
          theme === 'dark' 
            ? 'bg-[#161B22] border-[#2A2F3A]' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[#22C55E]" />
            <span className={`text-xs ${theme === 'dark' ? 'text-[#9BA4B5]' : 'text-gray-600'}`}>
              Top Strategy
            </span>
          </div>
          <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#E6EDF3]' : 'text-gray-900'}`}>
            Momentum (64%)
          </div>
        </div>
      </div>
    </div>
  );
}