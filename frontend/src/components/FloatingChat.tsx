import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, ChevronRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = [
  'Speed limit kya hai?',
  'नींद आ रही है क्या करूं?',
  'Accident pe kya karein?',
];

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'bot',
      text: 'नमस्ते! 🙏 मैं RastaRaksha AI हूँ। सड़क सुरक्षा से जुड़े कोई भी सवाल पूछें।',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [suggestionsUsed, setSuggestionsUsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setSuggestionsUsed(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), language: 'hi' }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: data.response || 'Sorry, I could not process that.',
      };
      setMessages(prev => [...prev, botMsg]);
      if (!isOpen) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: 'Backend offline. Please try again later. / कृपया बाद में प्रयास करें।',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Popup */}
      <div
        className={`fixed bottom-20 right-4 z-[9998] transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
        }`}
        style={{ width: 320, height: 440 }}
      >
        <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-rr-border bg-rr-surface">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rr-red to-red-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">RastaRaksha AI</p>
                <p className="text-white/70 text-[10px] leading-none mt-0.5">सड़क सुरक्षा सहायक</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ minHeight: 0 }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'bot' && (
                  <div className="w-6 h-6 bg-rr-red/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-rr-red" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-rr-red text-white rounded-tr-sm'
                      : 'bg-rr-card text-rr-text rounded-tl-sm border border-rr-border'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 bg-rr-blue/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-rr-blue" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-rr-red/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-rr-red animate-pulse" />
                </div>
                <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-rr-card border border-rr-border">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-rr-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-rr-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-rr-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips — show only before first user message */}
          {!suggestionsUsed && (
            <div className="px-3 pb-2 flex flex-col gap-1.5 flex-shrink-0">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-rr-card border border-rr-border hover:border-rr-red/40 hover:bg-rr-red/5 transition-all text-left"
                >
                  <span className="text-rr-text-secondary text-[11px]">{s}</span>
                  <ChevronRight className="w-3 h-3 text-rr-text-muted flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-rr-border flex-shrink-0 bg-rr-card/30">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="सवाल पूछें..."
              className="flex-1 bg-rr-bg border border-rr-border rounded-xl px-3 py-2 text-[12px] text-rr-text placeholder:text-rr-text-muted focus:outline-none focus:border-rr-red/50 transition-colors"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="w-8 h-8 bg-rr-red rounded-xl flex items-center justify-center text-white hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Trigger Button */}
      <button
        id="floating-chat-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] w-14 h-14 bg-gradient-to-br from-rr-red to-red-700 rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(229,57,53,0.5)] hover:shadow-[0_4px_32px_rgba(229,57,53,0.7)] hover:scale-110 active:scale-95 transition-all"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {unread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rr-amber text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-rr-bg">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
