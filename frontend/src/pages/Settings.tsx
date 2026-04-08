import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBar from '../components/dashboard/HeaderBar';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileSettings {
  name: string;
  email: string;
  phone: string;
  vehicle: string;
}

interface AlertSettings {
  voiceAlerts: boolean;
  potholeAlerts: boolean;
  drowsinessAlerts: boolean;
  blackspotAlerts: boolean;
  sensitivity: number; // 0=Low 1=Medium 2=High
}

interface DisplaySettings {
  refreshRate: number; // seconds
  showFps: boolean;
  compactMode: boolean;
}

interface PrivacySettings {
  shareData: boolean;
  locationTracking: boolean;
  tripHistory: boolean;
}

// ─── Alert translations ──────────────────────────────────────────────────────
const alertTranslations: Record<string, Record<string, string>> = {
  pothole: {
    en: 'Pothole detected ahead!',
    hi: 'आगे गड्ढा है! सावधान रहें',
    mr: 'पुढे खड्डा आहे! सावधान',
    ta: 'முன்னால் குழி உள்ளது!',
    te: 'ముందు గుంత ఉంది!',
    bn: 'সামনে গর্ত আছে!',
  },
  drowsy: {
    en: 'Drowsiness detected! Take a break',
    hi: 'नींद आ रही है! रुकें',
    mr: 'झोप येत आहे! थांबा',
    ta: 'தூக்கம் வருகிறது! நிறுத்துங்கள்',
    te: 'నిద్ర వస్తోంది! ఆపండి',
    bn: 'ঘুম আসছে! থামুন',
  },
};

const langCodes: Record<string, string> = {
  hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', en: 'en-US',
};

export const speak = (type: string) => {
  const lang = localStorage.getItem('language') || 'hi';
  const text = alertTranslations[type]?.[lang] ?? alertTranslations[type]['en'];
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langCodes[lang] ?? 'en-US';
  window.speechSynthesis.speak(u);
};

// ─── Languages list ──────────────────────────────────────────────────────────
const languages = [
  { code: 'en', name: 'English',   flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी',     flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी',     flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்',    flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు',   flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা',    flag: '🇮🇳' },
];

// ─── Helper components ────────────────────────────────────────────────────────
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#161B20',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '16px',
      }}
    >
      <h2
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#8B9299',
          marginBottom: '18px',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      style={{
        width: '40px',
        height: '22px',
        borderRadius: '11px',
        background: checked ? '#E53935' : '#2a313a',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '21px' : '3px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }}
      />
    </button>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span style={{ fontSize: '13px', color: '#F5F5F5' }}>{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          color: '#8B9299',
          marginBottom: '6px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          background: '#0D1117',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: '#F5F5F5',
          fontSize: '13px',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = 'rgba(229,57,53,0.5)')
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')
        }
      />
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();

  // Profile
  const [profile, setProfile] = useState<ProfileSettings>({ name: 'Amir Ali', email: 'amir@rastaraksha.ai', phone: '+91 98765 43210', vehicle: 'Car' });
  const [profileSaved, setProfileSaved] = useState(false);

  // Language
  const [language, setLanguage] = useState<string>('hi');

  // Alert settings
  const [alerts, setAlerts] = useState<AlertSettings>({
    voiceAlerts: true, potholeAlerts: true, drowsinessAlerts: true, blackspotAlerts: true, sensitivity: 1
  });

  // Display settings
  const [display, setDisplay] = useState<DisplaySettings>({ refreshRate: 5, showFps: false, compactMode: false });

  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({ shareData: true, locationTracking: true, tripHistory: true });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from backend
  useEffect(() => {
    fetch('http://127.0.0.1:8000/settings/')
      .then(r => r.json())
      .then(data => {
        if (data.profile) setProfile(data.profile);
        if (data.alertSettings) setAlerts(data.alertSettings);
        if (data.displaySettings) setDisplay(data.displaySettings);
        if (data.privacySettings) setPrivacy(data.privacySettings);
        if (data.language) {
          setLanguage(data.language);
          localStorage.setItem('language', data.language); // Sync local language for speech
        }
        setIsLoaded(true);
      })
      .catch(e => {
        console.error("Failed to load settings:", e);
        setIsLoaded(true); // Fallback to defaults
      });
  }, []);

  // Save changes to backend
  const saveSettingsToBackend = (updates: any) => {
    fetch('http://127.0.0.1:8000/settings/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(e => console.error("Failed to save:", e));
  };

  useEffect(() => {
    if (isLoaded) saveSettingsToBackend({ alertSettings: alerts });
  }, [alerts, isLoaded]);

  useEffect(() => {
    if (isLoaded) saveSettingsToBackend({ displaySettings: display });
  }, [display, isLoaded]);

  useEffect(() => {
    if (isLoaded) saveSettingsToBackend({ privacySettings: privacy });
  }, [privacy, isLoaded]);

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    localStorage.setItem('language', code);
    if (isLoaded) saveSettingsToBackend({ language: code });
  };

  const saveProfile = () => {
    saveSettingsToBackend({ profile });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const deleteAllTripData = () => {
    if (window.confirm('Delete all trip data? This cannot be undone.')) {
      localStorage.removeItem('tripData');
    }
  };

  const sensitivityLabels = ['Low', 'Medium', 'High'];

  return (
    <div style={{ minHeight: '100vh', background: '#080B0E', color: '#F5F5F5' }}>
      <HeaderBar />

      <div style={{ maxWidth: '740px', margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#8B9299',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F5F5F5' }}>Settings</h1>
            <p style={{ fontSize: '12px', color: '#4A5058', marginTop: '2px' }}>
              RastaRaksha AI preferences
            </p>
          </div>
        </div>

        {/* 1. Profile Settings */}
        <SectionCard title="1 · Profile Settings">
          <InputField
            label="Name"
            value={profile.name}
            onChange={(v) => setProfile({ ...profile, name: v })}
          />
          <InputField
            label="Email"
            value={profile.email}
            onChange={(v) => setProfile({ ...profile, email: v })}
            type="email"
          />
          <InputField
            label="Phone Number"
            value={profile.phone}
            onChange={(v) => setProfile({ ...profile, phone: v })}
            type="tel"
          />
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                color: '#8B9299',
                marginBottom: '6px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Vehicle Type
            </label>
            <select
              value={profile.vehicle}
              onChange={(e) => setProfile({ ...profile, vehicle: e.target.value })}
              style={{
                width: '100%',
                background: '#0D1117',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#F5F5F5',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {['Car', 'Truck', 'Bus', 'Two-wheeler', 'Other'].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={saveProfile}
            style={{
              background: profileSaved ? '#00C853' : '#E53935',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
          >
            {profileSaved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </SectionCard>

        {/* 2. Language Settings */}
        <SectionCard title="2 · Language Settings">
          <p style={{ fontSize: '12px', color: '#8B9299', marginBottom: '16px' }}>
            Applies to all UI text, alert messages, and voice alerts.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  background: language === lang.code ? 'rgba(229,57,53,0.15)' : '#0D1117',
                  border:
                    language === lang.code
                      ? '1px solid rgba(229,57,53,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '12px 8px',
                  color: language === lang.code ? '#E53935' : '#8B9299',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  fontSize: '13px',
                  fontWeight: language === lang.code ? 700 : 500,
                }}
              >
                <span style={{ fontSize: '22px' }}>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => speak('pothole')}
            style={{
              background: 'rgba(33,150,243,0.1)',
              border: '1px solid rgba(33,150,243,0.2)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#2196F3',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            🔊 Test Voice Alert (Pothole)
          </button>
        </SectionCard>

        {/* 3. Alert Settings */}
        <SectionCard title="3 · Alert Settings">
          <ToggleRow
            label="Voice Alerts"
            checked={alerts.voiceAlerts}
            onChange={() => setAlerts({ ...alerts, voiceAlerts: !alerts.voiceAlerts })}
          />
          <ToggleRow
            label="Pothole Alerts"
            checked={alerts.potholeAlerts}
            onChange={() => setAlerts({ ...alerts, potholeAlerts: !alerts.potholeAlerts })}
          />
          <ToggleRow
            label="Drowsiness Alerts"
            checked={alerts.drowsinessAlerts}
            onChange={() => setAlerts({ ...alerts, drowsinessAlerts: !alerts.drowsinessAlerts })}
          />
          <ToggleRow
            label="Blackspot Proximity Alerts"
            checked={alerts.blackspotAlerts}
            onChange={() => setAlerts({ ...alerts, blackspotAlerts: !alerts.blackspotAlerts })}
          />

          {/* Sensitivity Slider */}
          <div style={{ marginTop: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#F5F5F5' }}>Alert Sensitivity</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color:
                    alerts.sensitivity === 0
                      ? '#00C853'
                      : alerts.sensitivity === 1
                      ? '#FF9800'
                      : '#E53935',
                }}
              >
                {sensitivityLabels[alerts.sensitivity]}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={alerts.sensitivity}
              onChange={(e) =>
                setAlerts({ ...alerts, sensitivity: Number(e.target.value) })
              }
              style={{ width: '100%', accentColor: '#E53935', cursor: 'pointer' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
              }}
            >
              {sensitivityLabels.map((l) => (
                <span key={l} style={{ fontSize: '10px', color: '#4A5058' }}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* 4. Display Settings */}
        <SectionCard title="4 · Display Settings">
          {/* Theme — Locked */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span style={{ fontSize: '13px', color: '#F5F5F5' }}>Theme</span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#4A5058',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '6px',
                padding: '4px 10px',
              }}
            >
              🌑 Dark (Only)
            </span>
          </div>

          {/* Refresh Rate */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span style={{ fontSize: '13px', color: '#F5F5F5' }}>Dashboard Refresh Rate</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[3, 5, 10].map((r) => (
                <button
                  key={r}
                  onClick={() => setDisplay({ ...display, refreshRate: r })}
                  style={{
                    background:
                      display.refreshRate === r
                        ? 'rgba(229,57,53,0.15)'
                        : 'rgba(255,255,255,0.04)',
                    border:
                      display.refreshRate === r
                        ? '1px solid rgba(229,57,53,0.4)'
                        : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    color: display.refreshRate === r ? '#E53935' : '#8B9299',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {r}s
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Show FPS Counter"
            checked={display.showFps}
            onChange={() => setDisplay({ ...display, showFps: !display.showFps })}
          />
          <ToggleRow
            label="Compact Mode"
            checked={display.compactMode}
            onChange={() => setDisplay({ ...display, compactMode: !display.compactMode })}
          />
        </SectionCard>

        {/* 5. Privacy & Data */}
        <SectionCard title="5 · Privacy & Data">
          <ToggleRow
            label="Share anonymous data with MoRTH"
            checked={privacy.shareData}
            onChange={() => setPrivacy({ ...privacy, shareData: !privacy.shareData })}
          />
          <ToggleRow
            label="Location Tracking"
            checked={privacy.locationTracking}
            onChange={() =>
              setPrivacy({ ...privacy, locationTracking: !privacy.locationTracking })
            }
          />
          <ToggleRow
            label="Trip History"
            checked={privacy.tripHistory}
            onChange={() => setPrivacy({ ...privacy, tripHistory: !privacy.tripHistory })}
          />
          <button
            onClick={deleteAllTripData}
            style={{
              marginTop: '16px',
              background: 'rgba(229,57,53,0.1)',
              border: '1px solid rgba(229,57,53,0.3)',
              borderRadius: '8px',
              padding: '10px 20px',
              color: '#E53935',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🗑️ Delete All Trip Data
          </button>
        </SectionCard>

        {/* 6. About */}
        <SectionCard title="6 · About">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#8B9299' }}>App Version</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F5F5F5' }}>v1.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#8B9299' }}>Backend Status</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#00C853' }}>
                ● Online
              </span>
            </div>
            <div
              style={{
                height: '1px',
                background: 'rgba(255,255,255,0.04)',
                margin: '4px 0',
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  color: '#F5F5F5',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                🔄 Check for Updates
              </button>
              <a
                href="mailto:support@rastaraksha.ai"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  color: '#2196F3',
                  fontSize: '12px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                🐛 Report a Bug
              </a>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
