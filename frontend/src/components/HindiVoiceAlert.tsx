import { useState, useEffect } from 'react';
import { Mic, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

const ALERT_BUTTONS = [
  { text: "आगे गड्ढा है! सावधान रहें", label: "गड्ढा आगे है", sub: "Pothole Ahead" },
  { text: "नींद आ रही है! कृपया जगे रहें", label: "नींद आ रही है", sub: "Drowsiness" },
  { text: "गति सीमा पार! धीमे चलें", label: "गति सीमा पार", sub: "Speed Limit" },
  { text: "सड़क सुरक्षित है! शुभ यात्रा", label: "सड़क सुरक्षित है", sub: "Road Clear" }
];

export default function HindiVoiceAlert() {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
    }
  }, []);

  const speak = (text: string) => {
    if (!supported || isMuted) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!supported) {
    return (
      <div className="bg-[#1A1A1A] rounded-xl border border-[#E53935]/30 p-4 text-center">
        <AlertTriangle className="w-8 h-8 text-[#E53935] mx-auto mb-2" />
        <p className="text-white text-sm font-medium">Speech API Not Supported</p>
        <p className="text-gray-400 text-xs">Your browser does not support voice alerts.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 relative overflow-hidden">
      {/* Background Pulse Animation when speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 bg-[#E53935]/5 animate-pulse pointer-events-none" />
      )}

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isSpeaking ? 'bg-[#E53935] animate-bounce' : 'bg-[#E53935]/10'}`}>
            <Mic className={`w-5 h-5 ${isSpeaking ? 'text-white' : 'text-[#E53935]'}`} />
          </div>
          <div>
            <h3 className="text-white font-semibold">Hindi Voice Alerts</h3>
            <p className="text-gray-400 text-xs">हिंदी वॉयस अलर्ट</p>
          </div>
        </div>

        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-gray-800 text-gray-500' : 'bg-[#2A2A2A] text-[#4CAF50]'}`}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-col items-center mb-8 relative z-10">
        <button
          onClick={() => speak("आगे गड्ढा है! सावधान रहें")}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSpeaking 
              ? 'bg-[#E53935] shadow-[0_0_30px_#E53935]' 
              : 'bg-[#E53935]/20 hover:bg-[#E53935]/30 border-2 border-[#E53935]'
          }`}
        >
          {isSpeaking ? (
            <div className="flex gap-1">
              <span className="w-1 h-6 bg-white rounded-full animate-pulse" />
              <span className="w-1 h-10 bg-white rounded-full animate-pulse delay-75" />
              <span className="w-1 h-6 bg-white rounded-full animate-pulse delay-150" />
            </div>
          ) : (
            <Mic className="w-10 h-10 text-[#E53935]" />
          )}
          
          {/* Pulse Rings */}
          {isSpeaking && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-[#E53935] animate-ping opacity-75" />
              <div className="absolute inset-[-10px] rounded-full border border-[#E53935] animate-ping opacity-40 delay-150" />
            </>
          )}
        </button>
        <p className="mt-4 text-[#E53935] font-bold animate-pulse">
          {isSpeaking ? "Speaking..." : "Tap to Alert"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        {ALERT_BUTTONS.map((btn, i) => (
          <button
            key={i}
            onClick={() => speak(btn.text)}
            className="flex flex-col items-center p-3 bg-[#242424] border border-[#333] rounded-lg hover:border-[#E53935] transition-all group"
          >
            <span className="text-white text-sm font-medium mb-1 group-hover:text-[#E53935] transition-colors">{btn.label}</span>
            <span className="text-gray-500 text-[10px] uppercase tracking-wider">{btn.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
