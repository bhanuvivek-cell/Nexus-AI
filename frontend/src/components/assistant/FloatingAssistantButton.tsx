import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { API_BASE_URL } from '../../lib/api';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { 
  Bot, 
  X, 
  Send, 
  Maximize2, 
  Sparkles, 
  RefreshCw 
} from 'lucide-react';

interface QuickMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const FloatingAssistantButton: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<QuickMessage[]>([
    {
      id: 'quick-1',
      role: 'assistant',
      content: 'Hello! I am your **Nexus Gemini Assistant**. Ask me about code, DSA, college concepts, or current opportunities!',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If user is already on the full assistant page, hide the floating button
  if (location.pathname === '/assistant') {
    return null;
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsg: QuickMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    const token = localStorage.getItem('nexus_auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Keep only last 10 messages to limit prompt size
    const apiHistory = updated.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    const assistantMsgId = `a-${Date.now()}`;

    try {
      const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: apiHistory,
          stream: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Could not get response from assistant.');
      }

      if (res.body) {
        // Add empty placeholder immediately so user sees the bubble appear
        setMessages((prev) => [
          ...prev,
          { id: assistantMsgId, role: 'assistant', content: '' },
        ]);
        setIsLoading(false);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const rawChunk = decoder.decode(value, { stream: true });
            for (const line of rawChunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const dataStr = line.substring(6).trim();
              if (!dataStr) continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) throw new Error(parsed.error);
                if (parsed.text) {
                  assistantContent += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId ? { ...msg, content: assistantContent } : msg
                    )
                  );
                }
              } catch (parseErr: any) {
                if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr;
              }
            }
          }
        }
      } else {
        // Fallback: non-streaming JSON
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: assistantMsgId, role: 'assistant', content: data.content },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ ' + (err.message || 'Service momentarily unavailable.'),
        },
      ]);
    } finally {
      setIsLoading(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-navy-900 text-saffron-500 hover:bg-navy-800 shadow-lg border border-navy-700 transition-all hover:scale-105 active:scale-95 group"
          title="Ask Nexus AI Assistant"
        >
          <Sparkles className="w-5 h-5 animate-pulse text-saffron-500" />
          <span className="text-xs font-bold text-white tracking-wide">Ask Gemini AI</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-navy-900 text-white">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-navy-800 text-saffron-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-saffron-500" />
              </div>
              <div>
                <div className="text-xs font-bold">Nexus AI Assistant</div>
                <div className="text-[10px] text-slate-300">Powered by Gemini</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/assistant"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-navy-800 transition-colors"
                title="Expand to Full Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-navy-800 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded bg-navy-900 text-saffron-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-3 shadow-2xs ${
                    m.role === 'user'
                      ? 'bg-navy-900 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {m.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  ) : (
                    <MarkdownRenderer content={m.content} />
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded bg-navy-900 text-saffron-500 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-slate-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-saffron-600" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-navy-900"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-lg transition-colors ${
                input.trim() && !isLoading
                  ? 'bg-navy-900 text-saffron-500 hover:bg-navy-800'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

