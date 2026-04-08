import { useState, useRef, useEffect, useMemo } from 'react';
import HeaderBar from '../components/dashboard/HeaderBar';
import { Send, Bot, User, Languages, Loader2, MessageSquare, Plus, Search, ShieldCheck } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

interface ChatHistory {
  id: string;
  preview: string;
  time: string;
  active?: boolean;
}

const TOPICS = [
  'Traffic Rules', 'Emergency', 'Night Driving', 'Monsoon Tips', 'Highway Safety', 'MV Act 1988'
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'नमस्ते! मैं RastaRaksha AI हूँ। मैं आपकी सड़क सुरक्षा में क्या मदद कर सकता हूँ? \n\nHello! I am RastaRaksha AI. How can I assist you with road safety today?',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState<string>('hi');
  
  const langs = [
    { code: 'hi', label: 'HINDI', placeholder: 'सड़क सुरक्षा के बारे में कुछ भी पूछें...' },
    { code: 'en', label: 'ENGLISH', placeholder: 'Ask anything about road safety...' },
    { code: 'mr', label: 'MARATHI', placeholder: 'रस्ते सुरक्षेबद्दल काहीही विचारा...' },
    { code: 'ta', label: 'TAMIL', placeholder: 'சாலை பாதுகாப்பு பற்றி எதையும் கேளுங்கள்...' },
    { code: 'te', label: 'TELUGU', placeholder: 'రహదారి భద్రత గురించి ఏదైనా అడగండి...' },
    { code: 'bn', label: 'BENGALI', placeholder: 'সড়ক নিরাপত্তা সম্পর্কে কিছু জিজ্ঞাসা করুন...' }
  ];

  const currentLangObj = langs.find(l => l.code === language) || langs[0];

  const cycleLanguage = () => {
    const currentIndex = langs.findIndex(l => l.code === language);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex].code);
  };

  const history: ChatHistory[] = useMemo(() => [
    { id: '1', preview: 'NH-44 speed limits...', time: '2m ago', active: true },
    { id: '2', preview: 'What to do in heavy rain?', time: '1h ago' },
    { id: '3', preview: 'Nearest trauma centers', time: 'Yesterday' },
    { id: '4', preview: 'Drunk driving penalties', time: '3 days ago' },
  ], []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string = inputText) => {
    const messageToSend = text.trim();
    if (!messageToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          language: language,
          session_id: 'chat_page_user'
        })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '🚨 Backend services are currently overloaded. Please try again in a few moments.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-rr-bg overflow-hidden">
      <HeaderBar />

      <main className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: History (280px) */}
        <div className="w-[280px] flex flex-col border-r border-white/5 bg-[#0D1115]">
          <div className="p-4 border-b border-white/5">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rr-red/30 text-rr-red text-xs font-bold hover:bg-rr-red/5 transition-all mb-4">
              <Plus className="w-4 h-4" />
              NEW CHAT
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-rr-text-muted" />
              <input 
                type="text" 
                placeholder="Search history..." 
                className="w-full bg-black/20 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[11px] text-white outline-none focus:border-white/10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {history.map(item => (
              <div 
                key={item.id} 
                className={`p-3 rounded-xl cursor-pointer transition-all border-l-2 ${
                  item.active ? 'bg-[#161B20] border-rr-red' : 'border-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-white text-[11px] font-semibold truncate pr-2">{item.preview}</span>
                  <span className="text-rr-text-muted text-[8px] font-bold whitespace-nowrap uppercase">{item.time}</span>
                </div>
                <div className="flex items-center gap-1 opacity-40">
                  <MessageSquare className="w-2.5 h-2.5 text-white" />
                  <span className="text-[9px] text-white">Previous session</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/5 bg-black/10">
            <div className="flex items-center gap-3 grayscale opacity-40">
              <ShieldCheck className="w-5 h-5 text-rr-green" />
              <div className="flex flex-col">
                <span className="text-white text-[10px] font-bold">SAFETY SYNC</span>
                <span className="text-[8px] text-white">Database v1.4.2</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN AREA: Active Chat */}
        <div className="flex-1 flex flex-col bg-[#111518]/30 relative">
          
          {/* Chat Page Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-rr-bg/40 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rr-red rounded-xl flex items-center justify-center shadow-lg shadow-red-900/10">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm tracking-tight">Safety Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-rr-green rounded-full animate-pulse"></span>
                  <p className="text-rr-text-muted text-[9px] font-black uppercase tracking-widest">Expert Support Active</p>
                </div>
              </div>
            </div>

            <button
              onClick={cycleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:border-rr-red/30 transition-all group"
            >
              <Languages className="w-3.5 h-3.5 text-rr-red group-hover:rotate-12 transition-transform" />
              <span className="text-white text-[10px] font-black uppercase tracking-widest">
                {currentLangObj.label}
              </span>
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Topic Chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => handleSendMessage(topic)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-rr-text-secondary hover:text-white hover:border-rr-red/30 transition-all"
                >
                  {topic}
                </button>
              ))}
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.sender === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md ${
                  message.sender === 'user' ? 'bg-rr-red' : 'bg-[#1C2228] border border-white/5'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-rr-red" />
                  )}
                </div>

                <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'} max-w-[65%]`}>
                  <div className={`px-5 py-3 rounded-2xl shadow-xl leading-relaxed text-sm ${
                    message.sender === 'user'
                      ? 'bg-rr-red text-white rounded-tr-none'
                      : 'bg-[#1C2228] text-rr-text border border-white/5 rounded-tl-none font-medium'
                  }`}>
                    {message.text}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 opacity-30">
                    <LocalClock size={10} className="text-white" />
                    <span className="text-[9px] text-white font-bold uppercase">{message.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4 animate-pulse">
                <div className="w-8 h-8 bg-[#1C2228] border border-white/5 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-rr-red" />
                </div>
                <div className="bg-[#1C2228] px-5 py-4 rounded-2xl border border-white/5 rounded-tl-none">
                  <Loader2 className="w-4 h-4 text-rr-text-muted animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-6 bg-rr-bg/60 backdrop-blur-xl border-t border-white/5">
            <div className="max-w-4xl mx-auto flex gap-3 items-center bg-[#0D1115] p-2 rounded-2xl border border-white/10 focus-within:border-rr-red/30 transition-all shadow-inner">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={currentLangObj.placeholder}
                className="flex-1 bg-transparent text-white px-4 py-2.5 text-sm outline-none placeholder-rr-text-muted font-medium"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isTyping || !inputText.trim()}
                className="bg-rr-red text-white p-3 rounded-xl hover:bg-rr-red/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
              >
                <Send className="w-5 h-5 rotate-45 -translate-y-0.5" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-rr-text-muted text-[8px] font-black uppercase tracking-[0.2em] opacity-40">
               <span>Compliance Act 1988</span>
               <div className="w-1 h-1 bg-white/20 rounded-full"></div>
               <span>AI SAFETY ENGINE V4</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LocalClock({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
