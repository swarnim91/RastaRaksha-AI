import { useState, useEffect } from 'react';
import { AlertTriangle, X, Volume2 } from 'lucide-react';

interface CriticalAlertBannerProps {
  message: string | null;
  hindiMessage: string | null;
  onDismiss: () => void;
}

export default function CriticalAlertBanner({ message, hindiMessage, onDismiss }: CriticalAlertBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, onDismiss]);

  if (!message) return null;

  const speakAlert = () => {
    if ('speechSynthesis' in window && hindiMessage) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(hindiMessage);
      u.lang = 'hi-IN';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div
      id="critical-alert-banner"
      className={`w-full animate-banner-pulse transition-all duration-300 ${visible ? 'opacity-100 max-h-16' : 'opacity-0 max-h-0 overflow-hidden'}`}
    >
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5 bg-rr-red/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
          <div>
            <span className="text-white font-bold text-sm">⚠️ {message}</span>
            {hindiMessage && (
              <span className="text-white/80 text-sm ml-2 hindi-text">— {hindiMessage}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={speakAlert}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Volume2 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
