import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LayoutDashboard, Map, MessageCircle, FileText } from 'lucide-react';

// ─── Weather Widget ──────────────────────────────────────────────────────────
interface WeatherData {
  city: string;
  temp: number | string;
  condition: string;
  icon: string;
}

function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    // ── DEMO MODE ─────────────────────────────────────────────────────────────
    if (!apiKey || apiKey === 'DEMO_MODE' || apiKey === 'your_openweathermap_api_key_here') {
      const hour = new Date().getHours();
      const demoConditions = [
        { city: 'New Delhi',  temp: 34, condition: 'Clear',        icon: '01d' },
        { city: 'Mumbai',     temp: 29, condition: 'Clouds',       icon: '02d' },
        { city: 'Bengaluru',  temp: 25, condition: 'Drizzle',      icon: '09d' },
        { city: 'Hyderabad',  temp: 31, condition: 'Partly Cloudy',icon: '03d' },
        { city: 'Kolkata',    temp: 33, condition: 'Haze',         icon: '50d' },
        { city: 'Chennai',    temp: 32, condition: 'Thunderstorm', icon: '11d' },
      ];
      // Pick demo city based on hour so it changes throughout the day
      const pick = demoConditions[hour % demoConditions.length];
      // Night icon variant after 6 PM
      const icon = hour >= 18 || hour < 6 ? pick.icon.replace('d', 'n') : pick.icon;
      // Simulate slight temp drop at night
      const temp = hour >= 18 || hour < 6 ? pick.temp - 4 : pick.temp;
      setWeather({ ...pick, icon, temp });
      return;
    }

    // ── REAL API via Open-Meteo ──────────────────────────────────────────────────────────────
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode to get city name
          const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const revData = await revRes.json();
          const cityName = revData.city || revData.locality || 'Local';
          
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const data = await res.json();
          
          // Map basic WMO codes to OpenWeather icons (rough mapping)
          const code = data.current_weather.weathercode;
          let icon = '01d';
          let condition = 'Clear';
          if (code >= 1 && code <= 3) { icon = '02d'; condition = 'Clouds'; }
          else if (code >= 45 && code <= 48) { icon = '50d'; condition = 'Fog'; }
          else if (code >= 51 && code <= 67) { icon = '09d'; condition = 'Rain'; }
          else if (code >= 71 && code <= 77) { icon = '13d'; condition = 'Snow'; }
          else if (code >= 80 && code <= 99) { icon = '11d'; condition = 'Storm'; }

          if (data.current_weather.is_day === 0) {
             icon = icon.replace('d', 'n');
          }

          setWeather({
            city: cityName,
            temp: Math.round(data.current_weather.temperature),
            condition: condition,
            icon: icon,
          });
        } catch {
          setWeather({ city: 'Delhi', temp: 32, condition: 'Clear', icon: '01d' });
        }
      },
      () => {
        setWeather({ city: 'Location Off', temp: '--', condition: 'Unknown', icon: '01d' });
      }
    );
  }, []);

  if (!weather) {
    return (
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        Loading…
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
      <img
        src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
        width="28"
        height="28"
        alt={weather.condition}
        style={{ filter: 'drop-shadow(0 0 4px rgba(255,200,0,0.4))' }}
      />
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{weather.temp}°C</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{weather.city}</span>
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────────────────────
interface Notification {
  id: number;
  type: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  color: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'safety',       icon: '⚠️',  title: 'Pothole Detected',    message: 'NH-44 pe gadda detect hua — drive carefully',                   time: '2 min ago',  read: false, color: '#E53935' },
  { id: 2, type: 'trip',         icon: '🚗',  title: 'Trip Started',         message: 'Aapki yatra shuru hui — safe drive karein',                      time: '15 min ago', read: false, color: '#2196F3' },
  { id: 3, type: 'alert',        icon: '😴',  title: 'Drowsiness Warning',   message: 'Driver fatigue detected — please take a break',                  time: '32 min ago', read: true,  color: '#FF9800' },
  { id: 4, type: 'blackspot',    icon: '🗺️', title: 'Blackspot Nearby',     message: 'NH-58 accident zone 2.3km ahead',                                time: '1 hr ago',   read: true,  color: '#E53935' },
  { id: 5, type: 'system',       icon: '✅',  title: 'System Active',        message: 'RastaRaksha AI successfully connected to backend',                time: '2 hr ago',   read: true,  color: '#00C853' },
  { id: 6, type: 'safety_score', icon: '🏆',  title: 'Safe Driver Badge',    message: 'Aapka safe score 87/100 hai — excellent driving!',               time: 'Today',      read: true,  color: '#00C853' },
  { id: 7, type: 'update',       icon: '🔔',  title: 'New Blackspot Added',  message: 'MoRTH ne Lucknow-Kanpur highway ko blackspot register kiya',     time: 'Yesterday',  read: true,  color: '#9C27B0' },
];

function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  if (!open) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: '60px',
        right: '80px',
        width: '320px',
        maxHeight: '480px',
        background: '#161B20',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#F5F5F5' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                background: '#E53935',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '1px 7px',
                minWidth: '20px',
                textAlign: 'center',
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={markAllRead}
          style={{
            background: 'none',
            border: 'none',
            color: '#2196F3',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          Mark all read
        </button>
      </div>

      {/* Items */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 16px',
              cursor: 'pointer',
              background: n.read ? 'transparent' : 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background =
                'rgba(255,255,255,0.06)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = n.read
                ? 'transparent'
                : 'rgba(255,255,255,0.03)')
            }
          >
            {/* Icon Circle */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: n.color + '22',
                border: `1px solid ${n.color}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}
            >
              {n.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: n.read ? 500 : 700,
                  color: n.read ? '#8B9299' : '#F5F5F5',
                  marginBottom: '3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {n.title}
              </p>
              <p
                style={{
                  fontSize: '12px',
                  color: '#4A5058',
                  lineHeight: '1.4',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {n.message}
              </p>
            </div>

            {/* Time */}
            <span
              style={{
                fontSize: '11px',
                color: '#4A5058',
                flexShrink: 0,
                paddingTop: '2px',
              }}
            >
              {n.time}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#2196F3',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}

// ─── Profile Popup ────────────────────────────────────────────────────────────
function ProfilePopup({
  open,
  onClose,
  onSettings,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  if (!open) return null;

  const menuItems = [
    { icon: '👤', label: 'My Profile' },
    { icon: '📊', label: 'My Reports' },
    { icon: '🔔', label: 'Alert Preferences' },
    { icon: '📱', label: 'Connected Devices' },
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: '60px',
        right: '12px',
        width: '260px',
        background: '#161B20',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Section A — Profile Header */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E53935, #b71c1c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 800,
            color: '#fff',
          }}
        >
          A
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: '14px', color: '#F5F5F5' }}>Amir Ali</p>
          <p style={{ fontSize: '11px', color: '#8B9299', marginTop: '2px' }}>
            amir@rastaraksha.ai
          </p>
          <p style={{ fontSize: '11px', color: '#00C853', marginTop: '4px' }}>
            🟢 Active Driver
          </p>
        </div>
      </div>

      {/* Section B — Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px',
          background: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {[
          { icon: '🚗', value: '12', label: 'Total Trips' },
          { icon: '📏', value: '234 km', label: 'Total Dist' },
          { icon: '🏆', value: '87/100', label: 'Avg Score' },
          { icon: '⚠️', value: '23', label: 'Alerts' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              padding: '12px 14px',
              background: '#161B20',
            }}
          >
            <p style={{ fontSize: '16px', marginBottom: '2px' }}>{stat.icon}</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#F5F5F5' }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '10px', color: '#4A5058', marginTop: '1px' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Section C — Menu Items */}
      <div>
        {menuItems.map((item) => (
          <button
            key={item.label}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0 16px',
              height: '40px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#F5F5F5',
              fontSize: '13px',
              transition: 'background 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                'rgba(255,255,255,0.05)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'none')
            }
          >
            <span style={{ width: '18px' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            <span style={{ color: '#4A5058' }}>›</span>
          </button>
        ))}

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

        {/* Settings */}
        <button
          onClick={() => { onSettings(); onClose(); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 16px',
            height: '40px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#F5F5F5',
            fontSize: '13px',
            transition: 'background 0.15s',
            textAlign: 'left',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.05)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = 'none')
          }
        >
          <span style={{ width: '18px' }}>⚙️</span>
          <span style={{ flex: 1 }}>Settings</span>
          <span style={{ color: '#4A5058' }}>›</span>
        </button>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

        {/* Logout */}
        <button
          onClick={() => { onLogout(); onClose(); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 16px',
            height: '40px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#E53935',
            fontSize: '13px',
            transition: 'background 0.15s',
            textAlign: 'left',
            marginBottom: '4px',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              'rgba(229,57,53,0.08)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = 'none')
          }
        >
          <span style={{ width: '18px' }}>🚪</span>
          <span style={{ flex: 1 }}>Logout</span>
        </button>
      </div>
    </div>
  );
}

// ─── HeaderBar ───────────────────────────────────────────────────────────────
export default function HeaderBar() {
  const [time, setTime] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLElement>(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const istTime = time.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const istDate = time.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/map',       icon: Map,             label: 'Blackspots' },
    { path: '/chat',      icon: MessageCircle,   label: 'Chat' },
    { path: '/reports',   icon: FileText,        label: 'Reports' },
  ];

  const unreadCount = INITIAL_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header
      id="header-bar"
      ref={headerRef}
      className="w-full bg-rr-surface/80 backdrop-blur-xl border-b border-rr-border px-4 lg:px-6 h-14 flex items-center justify-between sticky top-0 z-50"
      style={{ position: 'sticky', top: 0 }}
    >
      {/* ── Left: Logo + Status + Nav ── */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <img src="/rastaraksha-logo.png" alt="RastaRaksha AI" className="w-9 h-9 rounded-lg object-cover shadow-lg" />
          <div className="hidden sm:block">
            <h1 className="text-rr-text font-bold text-sm leading-none">RastaRaksha AI</h1>
            <p className="text-rr-text-muted text-[10px] leading-none mt-0.5">रास्ता रक्षा</p>
          </div>
        </Link>

        {/* System Active Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rr-green/10 border border-rr-green/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rr-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rr-green"></span>
          </span>
          <span className="text-rr-green text-[10px] font-semibold uppercase tracking-wider">
            System Active
          </span>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-rr-red/15 text-rr-red'
                    : 'text-rr-text-secondary hover:text-rr-text hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Right: Weather · Time · Notif · Driver ── */}
      <div className="flex items-center gap-3 lg:gap-4" style={{ position: 'relative' }}>
        {/* Weather */}
        <div className="hidden xl:flex items-center">
          <WeatherWidget />
        </div>

        {/* Separator */}
        <div className="hidden xl:block w-px h-6 bg-rr-border" />

        {/* Time */}
        <div className="hidden md:block text-right">
          <p className="text-rr-text text-xs font-semibold tabular-nums leading-none">{istTime}</p>
          <p className="text-rr-text-muted text-[10px] leading-none mt-0.5">{istDate}</p>
        </div>

        {/* Notifications Bell */}
        <button
          id="notifications-btn"
          onClick={(e) => {
            e.stopPropagation();
            setNotifOpen((v) => !v);
            setProfileOpen(false);
          }}
          className="relative p-2 text-rr-text-secondary hover:text-rr-text hover:bg-white/5 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rr-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Panel */}
        <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

        {/* Profile Button */}
        <button
          id="profile-btn"
          onClick={(e) => {
            e.stopPropagation();
            setProfileOpen((v) => !v);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-rr-card hover:bg-rr-card-hover rounded-lg border border-rr-border transition-colors"
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E53935, #b71c1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 800,
              color: '#fff',
            }}
          >
            A
          </div>
          <span className="text-rr-text text-xs font-medium hidden sm:block">Driver</span>
        </button>

        {/* Profile Popup */}
        <ProfilePopup
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          onSettings={() => navigate('/settings')}
          onLogout={() => navigate('/')}
        />
      </div>
    </header>
  );
}
