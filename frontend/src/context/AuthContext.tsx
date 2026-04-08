import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'gov' | 'ngo' | null;

interface AuthUser {
  email: string;
  role: UserRole;
  name: string;
  department?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => ({ success: false }),
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

// Government email domains
const GOV_DOMAINS = ['gov.in', 'nic.in', 'morth.gov.in', 'nhai.gov.in', 'pmgsy.gov.in', 'pwd.gov.in'];
// NGO email domains (for demo, we accept common ones too)
const NGO_KEYWORDS = ['ngo', 'foundation', 'trust', 'samiti', 'society', 'welfare'];

function detectRole(email: string): UserRole {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  
  // Check government domains
  if (GOV_DOMAINS.some(d => domain.endsWith(d))) return 'gov';
  
  // Check NGO keywords in email/domain
  const lowerEmail = email.toLowerCase();
  if (NGO_KEYWORDS.some(k => lowerEmail.includes(k))) return 'ngo';
  
  // Default: allow free-form but require explicit role selection
  return null;
}

function getDisplayName(email: string, role: UserRole): string {
  if (role === 'gov') return 'IAS Officer';
  if (role === 'ngo') return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return 'User';
}

function getDepartment(email: string, role: UserRole): string | undefined {
  if (role === 'gov') {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    if (domain.includes('morth')) return 'Ministry of Road Transport & Highways';
    if (domain.includes('nhai')) return 'National Highways Authority of India';
    if (domain.includes('pwd')) return 'Public Works Department';
    return 'Government of India';
  }
  if (role === 'ngo') return 'Registered NGO';
  return undefined;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('rr_auth');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('rr_auth', JSON.stringify(user));
    } else {
      localStorage.removeItem('rr_auth');
    }
  }, [user]);

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    if (!email || !password) return { success: false, error: 'Email and password are required.' };
    if (password.length < 4) return { success: false, error: 'Invalid credentials.' };

    const role = detectRole(email);
    if (!role) {
      return { success: false, error: 'Use a government email (@gov.in, @nic.in) or an NGO email to login.' };
    }

    const authUser: AuthUser = {
      email,
      role,
      name: getDisplayName(email, role),
      department: getDepartment(email, role),
    };
    setUser(authUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rr_auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
