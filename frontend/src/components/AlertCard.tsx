import { AlertTriangle, Eye, Gauge, Volume2 } from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  typeHi: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  message: string;
  messageHi: string;
}

interface AlertCardProps {
  alert: Alert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  const severityColors = {
    HIGH: 'bg-red-500 text-white',
    MEDIUM: 'bg-yellow-500 text-black',
    LOW: 'bg-green-500 text-white',
  };

  const icons = {
    Pothole: AlertTriangle,
    Drowsiness: Eye,
    Speed: Gauge,
  };

  const iconType = alert.type.includes('Pothole')
    ? 'Pothole'
    : alert.type.includes('Drowsy')
    ? 'Drowsiness'
    : 'Speed';

  const Icon = icons[iconType];

  const speakHindi = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-[#242424] border border-[#2A2A2A] rounded-lg p-4 hover:border-[#E53935] transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#E53935]/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#E53935]" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-white font-semibold">{alert.type}</h4>
              <p className="text-gray-400 text-xs">{alert.typeHi}</p>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-bold ${severityColors[alert.severity]}`}
            >
              {alert.severity}
            </span>
          </div>

          <p className="text-gray-300 text-sm mb-1">{alert.message}</p>
          <p className="text-[#E53935] text-sm font-medium mb-2">{alert.messageHi}</p>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">{alert.timestamp}</span>
            <button
              onClick={() => speakHindi(alert.messageHi)}
              className="flex items-center gap-1 text-xs text-[#E53935] hover:text-[#C62828] transition-colors"
            >
              <Volume2 className="w-3 h-3" />
              Hindi Voice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { Alert };
