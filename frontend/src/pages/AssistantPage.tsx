import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/api';
import { MarkdownRenderer } from '../components/ui/MarkdownRenderer';
import { Button } from '../components/ui/Button';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  User, 
  RefreshCw, 
  Code2, 
  Briefcase, 
  GraduationCap, 
  Terminal,
  AlertCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const STARTER_PROMPTS = [
  {
    icon: Code2,
    title: 'DSA & Coding',
    prompt: 'Explain how Dijkstra’s shortest path algorithm works with an example and its time complexity in C++ or Python.',
  },
  {
    icon: Briefcase,
    title: 'Career & Opportunities',
    prompt: 'What verified internship opportunities in the Nexus AI database match my profile and skills?',
  },
  {
    icon: GraduationCap,
    title: 'Skill Gap Analysis',
    prompt: 'Review my current student skills and recommend the top 3 technologies I should learn next for a backend engineering role.',
  },
  {
    icon: Terminal,
    title: 'System Concepts',
    prompt: 'Explain the difference between a Process and a Thread in Operating Systems with a real-world analogy.',
  },
];

export const AssistantPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'initial',
        role: 'assistant',
        content: `👋 Hello${user?.username ? ` **@${user.username}**` : ''}! I am **Nexus AI Assistant**, powered by **Google Gemini**.

I can answer any general-purpose technical and conceptual questions:
- **Programming & Debugging**: Python, Java, C++, JavaScript, Go, SQL, Web Dev.
- **DSA & Algorithms**: LeetCode problems, graph algorithms, dynamic programming, complexity.
- **AI & ML**: Neural networks, transformers, machine learning, embeddings.
- **Academics & Core CS**: Operating Systems, Computer Networks, DBMS, Math.
- **Personalized Career Intelligence**: Grounded in your real **Nexus AI profile, saved skills, and live database opportunities**.

How can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string>('gemini-3.1-flash-lite');
  const [rotationInfo, setRotationInfo] = useState<{ enabled: boolean; keyCount: number }>({
    enabled: false,
    keyCount: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Check backend Gemini status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/assistant/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.model) {
            setModelName(data.model);
          }
          if (data.rotation_enabled) {
            setRotationInfo({ enabled: true, keyCount: data.key_count || 0 });
          }
        }
      } catch (err) {
        console.debug('Assistant status note:', err);
      }
    };
    fetchStatus();
  }, []);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isLoading) return;

    setInput('');
    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    // Prepare conversation history for backend — trim to last 10 messages
    // to limit prompt size. The full history is shown in the UI only.
    const apiHistory = updatedMessages
      .filter((m) => m.id !== 'initial')
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    const token = localStorage.getItem('nexus_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Attempt streaming with SSE
      const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: apiHistory,
          stream: true,
        }),
      });

      if (!res.ok) {
        let errDetail = 'Failed to get response from Gemini.';
        try {
          const errJson = await res.json();
          errDetail = errJson.detail || errDetail;
        } catch {
          errDetail = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(errDetail);
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        // Add empty assistant placeholder
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const rawChunk = decoder.decode(value, { stream: true });
            const lines = rawChunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6).trim();
                if (!dataStr) continue;

                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                  if (parsed.text) {
                    assistantContent += parsed.text;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMsgId ? { ...msg, content: assistantContent } : msg
                      )
                    );
                  }
                } catch (parseErr: any) {
                  if (parseErr.message && !parseErr.message.includes('JSON')) {
                    throw parseErr;
                  }
                }
              }
            }
          }
        }
      } else {
        // Fallback standard JSON
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: data.content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'An error occurred while communicating with Gemini.');
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear entire chat history?')) {
      setMessages([
        {
          id: 'initial',
          role: 'assistant',
          content: 'Chat history cleared. How can I assist you with code, concepts, or career intelligence today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setErrorMessage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-saffron-500 shadow-xs">
            <Sparkles className="w-5 h-5 text-saffron-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-navy-900 tracking-tight">
                Nexus AI Assistant
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-800 uppercase tracking-wider font-mono">
                {modelName}
              </span>
              {rotationInfo.enabled && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wide font-mono flex items-center gap-1" title="API Key Rotation Active">
                  <span>🔄</span> {rotationInfo.keyCount} Keys Rotated
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              General Intelligence, Programming & Grounded Career Mentorship
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              @{user.username} Profile Connected
            </span>
          ) : (
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
              Guest Mode
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="text-slate-600 hover:text-red-600 hover:border-red-200"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-navy-900 text-saffron-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm shadow-xs ${
                msg.role === 'user'
                  ? 'bg-navy-900 text-white rounded-br-xs'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              ) : (
                <div>
                  {msg.content ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    <div className="flex items-center gap-1.5 py-2 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-saffron-500 animate-ping" />
                      <span className="text-xs">Thinking & generating...</span>
                    </div>
                  )}
                </div>
              )}

              <div
                className={`text-[10px] mt-2 flex justify-end ${
                  msg.role === 'user' ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-saffron-100 text-saffron-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-saffron-200 shadow-2xs">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-navy-900 text-saffron-500 flex items-center justify-center shrink-0 shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-saffron-600" />
                <span>Gemini is generating response...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts (if chat is fresh) */}
      {messages.length <= 1 && (
        <div className="py-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Suggested Prompts
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STARTER_PROMPTS.map((starter, idx) => {
              const Icon = starter.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(starter.prompt)}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-navy-900 hover:bg-slate-50 text-left transition-all group"
                >
                  <div className="p-1.5 rounded-lg bg-slate-100 text-navy-800 group-hover:bg-navy-900 group-hover:text-saffron-500 transition-colors shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-navy-900">{starter.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{starter.prompt}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Composer */}
      <div className="pt-2 border-t border-slate-200">
        <div className="relative rounded-xl border border-slate-300 bg-white shadow-xs focus-within:border-navy-900 focus-within:ring-1 focus-within:ring-navy-900 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything (e.g. Python code, DSA problems, ML, or opportunities matching your skills)..."
            rows={2}
            className="w-full resize-none rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none pr-12"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2.5 bottom-2.5 p-2 rounded-lg transition-all ${
              input.trim() && !isLoading
                ? 'bg-navy-900 text-saffron-500 hover:bg-navy-800 shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Send message (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-1">
          <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line.</span>
          <span>Never shares private data externally.</span>
        </div>
      </div>
    </div>
  );
};
export default AssistantPage;

