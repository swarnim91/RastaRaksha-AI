import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
}

const SUGGESTIONS = [
  { text: '🚗 Speed limit kya hai?', val: 'What is the speed limit?' },
  { text: '😴 नींद आ रही है?', val: 'Feeling sleepy, what to do?' },
  { text: '🚨 Accident pe kya karein?', val: 'What to do in case of an accident?' },
];

export default function FloatingChatbot() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks must be called unconditionally

  useEffect(() => {
    if (isOpen && !hasStarted) {
      setMessages([
        {
          id: '0',
          role: 'bot',
          text: 'नमस्ते! मैं RastaRaksha AI हूँ। सड़क सुरक्षा से जुड़े कोई भी सवाल पूछें! 🛡️',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setHasStarted(true);
    }
  }, [isOpen, hasStarted]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setHasStarted(true);
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  const send = async (text: string) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;
    
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText.trim(), language: 'hi' }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: data.response || 'Sorry, I could not process that.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  if (['/', '/drive', '/chat'].includes(location.pathname)) return null;

  return (
    <>
      <div
        className={`fixed z-[9998] right-[24px] transition-all duration-400 ease-out origin-bottom-right ${
          isOpen ? 'bottom-[90px] opacity-100 scale-100 pointer-events-auto' : 'bottom-[70px] opacity-0 scale-75 pointer-events-none'
        }`}
        style={{ width: 320, height: 420 }}
      >
        <div className="w-full h-full flex flex-col bg-[#161B20] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#1C2228]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-rr-red rounded-full flex items-center justify-center shadow-lg shadow-red-900/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm leading-none">RastaRaksha AI</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 bg-rr-green rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-rr-green font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-rr-text-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                    msg.role === 'user'
                      ? 'bg-rr-red text-white rounded-tr-sm'
                      : 'bg-[#242A31] text-rr-text rounded-tl-sm border border-white/5'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-rr-text-muted mt-1 font-medium tabular-nums">{msg.time}</span>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-start gap-2">
                <div className="bg-[#242A31] px-4 py-2.5 rounded-2xl rounded-tl-sm border border-white/5">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-rr-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-rr-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-rr-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            {messages.length === 1 && !loading && (
              <div className="pt-2 flex flex-col gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s.val)}
                    className="w-fit px-3 py-2 bg-[#1C2228] border border-white/5 rounded-xl text-[11px] text-rr-text-secondary hover:text-white hover:border-rr-red/30 hover:bg-rr-red/5 transition-all text-left animate-slide-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-white/5 bg-[#1C2228]">
            <div className="flex items-center gap-2 bg-[#0D1115] border border-white/5 rounded-xl px-3 py-1.5 focus-within:border-rr-red/30 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(input)}
                placeholder="Kuch bhi poochhen..."
                className="flex-1 bg-transparent text-white text-xs outline-none py-1.5 placeholder:text-rr-text-muted"
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="w-8 h-8 bg-rr-red rounded-lg flex items-center justify-center text-white hover:bg-red-600 disabled:opacity-30 disabled:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5 rotate-45 -translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-[24px] right-[24px] z-[9999] w-14 h-14 bg-rr-red rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(229,37,33,0.3)] hover:shadow-[0_8px_48px_rgba(229,37,33,0.5)] hover:scale-110 active:scale-95 transition-all group ${
          unread > 0 && !isOpen ? 'animate-pulse' : ''
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        )}
        
        {unread > 0 && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-rr-red rounded-full flex items-center justify-center border-2 border-rr-red animate-pulse">
            <span className="w-1.5 h-1.5 bg-rr-red rounded-full"></span>
          </span>
        )}
      </button>
    </>
  );
}
