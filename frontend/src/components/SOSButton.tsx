import { useState, useEffect } from 'react';
import { Phone, X, MapPin, Building2, AlertTriangle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function SOSButton() {
  const locationPath = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [location, setLocation] = useState<string>('Detecting location...');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [calling, setCalling] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          // Reverse geocode via bigdatacloud (more reliable than nominatim)
          fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          )
            .then(r => r.json())
            .then(d => {
              const locStr = d.city || d.locality || d.principalSubdivision || 'Location found';
              setLocation(locStr);
            })
            .catch(() => setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`));
        },
        () => setLocation('GPS Unavailable')
      );
    }
  }, []);

  // Countdown when "calling"
  useEffect(() => {
    if (!calling) return;
    setCountdown(5);
    const iv = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(iv);
          setCalling(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [calling]);

  const handleSOS = () => {
    setShowModal(true);
    // Voice alert
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('आपातकाल! Emergency services called!');
      u.lang = 'hi-IN';
      window.speechSynthesis.speak(u);
    }
  };

  const NEARBY_HOSPITAL = 'AIIMS Trauma Centre — 3.2 km';

  return (
    <>
      {/* Floating SOS Button */}
      <button
        id="sos-floating-btn"
        onClick={handleSOS}
        className={`fixed z-[9999] w-14 h-14 bg-gradient-to-br from-rr-red to-red-800 rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(229,57,53,0.6)] hover:shadow-[0_4px_32px_rgba(229,57,53,0.9)] hover:scale-110 active:scale-95 transition-all animate-breathe ${
          locationPath.pathname === '/map' ? 'bottom-[24px] left-[300px]' : 'bottom-[24px] left-[24px]'
        }`}
      >
        <span className="text-white font-black text-xs leading-none">SOS</span>
      </button>

      {/* SOS Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => { setShowModal(false); setCalling(false); }}
          />

          {/* Modal */}
          <div className="relative w-full max-w-sm bg-rr-surface rounded-3xl border border-rr-red/40 shadow-[0_0_60px_rgba(229,57,53,0.4)] overflow-hidden animate-fade-in-up">
            {/* Top red bar */}
            <div className="bg-gradient-to-r from-rr-red to-red-700 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
                  <span className="text-white font-extrabold text-lg">EMERGENCY SOS</span>
                </div>
                <button onClick={() => { setShowModal(false); setCalling(false); }} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-white/80 text-xs mt-1 hindi-text">आपातकालीन सेवाएं</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Calling indicator */}
              {calling ? (
                <div className="flex flex-col items-center py-4">
                  <div className="w-16 h-16 rounded-full bg-rr-red/20 border-2 border-rr-red flex items-center justify-center mb-3 animate-pulse">
                    <Phone className="w-8 h-8 text-rr-red" />
                  </div>
                  <p className="text-rr-text font-bold text-lg">Calling Emergency Services...</p>
                  <p className="text-rr-text-muted text-sm mt-1">आपातकालीन सेवाएं बुला रहे हैं...</p>
                  <div className="mt-3 w-12 h-12 rounded-full bg-rr-red flex items-center justify-center">
                    <span className="text-white font-black text-xl tabular-nums">{countdown}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCalling(true)}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-rr-red hover:bg-red-600 text-white font-extrabold text-lg rounded-2xl transition-all active:scale-95 shadow-lg"
                >
                  <Phone className="w-6 h-6" />
                  📞 Call Emergency (112)
                </button>
              )}

              {/* Location */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-rr-card border border-rr-border">
                <MapPin className="w-4 h-4 text-rr-blue mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-rr-text-muted text-[10px] uppercase tracking-wider font-semibold">Your Location</p>
                  <p className="text-rr-text text-xs font-medium mt-0.5 leading-snug break-words">{location}</p>
                  {coords && (
                    <p className="text-rr-text-muted text-[10px] mt-0.5 tabular-nums">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>

              {/* Nearest Hospital */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-rr-green/5 border border-rr-green/20">
                <Building2 className="w-4 h-4 text-rr-green flex-shrink-0" />
                <div>
                  <p className="text-rr-text-muted text-[10px] uppercase tracking-wider font-semibold">Nearest Hospital</p>
                  <p className="text-rr-green text-xs font-semibold mt-0.5">{NEARBY_HOSPITAL}</p>
                </div>
              </div>

              {/* Cancel */}
              <button
                onClick={() => { setShowModal(false); setCalling(false); }}
                className="w-full py-2.5 rounded-xl border border-rr-border text-rr-text-secondary text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Cancel / रद्द करें
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
