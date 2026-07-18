import React, { useRef, useEffect } from 'react';
import { Send, Bot, User, RotateCcw, HelpCircle } from 'lucide-react';
import type { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onClearChat: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onClearChat
}) => {
  const [inputText, setInputText] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSuggestionClick = (text: string) => {
    if (isLoading) return;
    onSendMessage(text);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // A simple, light parser to highlight code fences and format breaks
  const formatMessageContent = (content: string) => {
    // Regex matching code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const lines = part.slice(3, -3).trim().split('\n');
        let language = 'code';
        let code = part.slice(3, -3).trim();
        
        if (lines[0] && !lines[0].includes(' ') && lines[0].length < 15) {
          language = lines[0];
          code = lines.slice(1).join('\n');
        }

        return (
          <div key={index} className="relative group my-2">
            <span className="absolute top-2 right-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider select-none">
              {language}
            </span>
            <pre className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Format inline code `code`
      const inlineParts = part.split(/(`[^`\n]+`)/g);
      return (
        <span key={index} className="whitespace-pre-wrap leading-relaxed">
          {inlineParts.map((subPart, subIndex) => {
            if (subPart.startsWith('`') && subPart.endsWith('`')) {
              return (
                <code key={subIndex} className="bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono text-blue-300">
                  {subPart.slice(1, -1)}
                </code>
              );
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  const suggestions = [
    'Explain Cloudflare Workers',
    'Write a Javascript array map function',
    'Translate "Good morning, friend" to Spanish',
    'What is edge computing?'
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden relative">
      
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-100 uppercase tracking-wider font-display">
              FleetMind
            </h3>
            <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">
              OPEA GenAI NetOps Copilot
            </span>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
        {messages.length === 0 ? (
          <div className="my-auto flex flex-col items-center text-center p-6 select-none max-w-[420px] mx-auto animate-fade-in">
            <div className="w-12 h-12 bg-blue-500/15 rounded-2xl flex items-center justify-center text-blue-400 mb-3 border border-blue-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Start a session with Workers AI</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Ask questions, write functions, or test translation rules. All messages are securely routed through serverless Cloudflare Workers.
            </p>

            {/* Suggestions list */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-6">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="p-2.5 bg-slate-950 border border-slate-800/80 hover:border-blue-500 hover:bg-slate-900 rounded-xl text-left text-[10px] font-semibold text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] animate-slide-in ${
                  isUser ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                {/* Profile Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${
                  isUser 
                    ? 'bg-blue-500/15 border-blue-500/20 text-blue-400' 
                    : 'bg-purple-500/15 border-purple-500/20 text-purple-400'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-950/60 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}>
                  {formatMessageContent(msg.content)}
                  <span className={`text-[8px] mt-1.5 block text-right font-medium select-none ${
                    isUser ? 'text-white/60' : 'text-slate-500'
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator Bubble */}
        {isLoading && (
          <div className="flex gap-3 self-start max-w-[85%] animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-950/60 backdrop-blur-md flex gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isLoading ? 'AI is processing...' : 'Type message here...'}
          disabled={isLoading}
          className="flex-1 input-field"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className={`px-4 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            inputText.trim() && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
      <div className="py-2.5 bg-slate-950/90 border-t border-slate-900/60 text-center text-[10px] text-slate-500 font-semibold tracking-wider font-display select-none">
        Powered by <span className="text-amber-500/80">BrytesikaStratgy AI</span> • Secure Serverless LLM Node
      </div>
    </div>
  );
};
