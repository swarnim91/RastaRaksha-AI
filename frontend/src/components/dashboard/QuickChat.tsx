import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
}

export default function QuickChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'bot',
      text: 'नमस्ते! मैं RastaRaksha AI हूँ। सड़क सुरक्षा से जुड़े सवाल पूछें।',
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text, language: 'hi' }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: data.response || 'Sorry, I could not process that.',
        time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'bot', text: 'Backend offline. कृपया बाद में पुनः प्रयास करें।', time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const visibleMessages = messages.slice(-3);

  return (
    <div id="quick-chat-card" className="glass-card p-4 flex flex-col" style={{ minHeight: 220 }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-rr-blue/10">
          <MessageCircle className="w-4 h-4 text-rr-blue" />
        </div>
        <div>
          <h3 className="text-rr-text font-semibold text-[13px] uppercase tracking-wider">Quick Chat</h3>
          <p className="text-rr-text-muted text-[10px]">AI सहायक</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto mb-3" style={{ maxHeight: 140 }}>
        {visibleMessages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-in`}>
            {msg.role === 'bot' && (
              <div className="w-5 h-5 bg-rr-blue/20 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-rr-blue" />
              </div>
            )}
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${msg.role === 'user' ? 'bg-rr-blue/20 text-rr-text' : 'bg-white/[0.04] text-rr-text-secondary'}`}>
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="w-5 h-5 bg-rr-green/20 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3 text-rr-green" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-5 h-5 bg-rr-blue/20 rounded-md flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-rr-blue animate-pulse" />
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/[0.04]">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-rr-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-rr-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-rr-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          id="quick-chat-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask RastaRaksha AI..."
          className="flex-1 bg-white/[0.04] border border-rr-border rounded-xl px-3 py-2 text-xs text-rr-text placeholder:text-rr-text-muted focus:outline-none focus:border-rr-blue/40 transition-colors"
        />
        <button
          id="quick-chat-send"
          onClick={send}
          disabled={loading || !input.trim()}
          className="p-2 bg-rr-blue rounded-xl text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
