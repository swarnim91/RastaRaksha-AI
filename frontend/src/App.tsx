import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import GovDashboard from './pages/GovDashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import EmergencyDispatch from './pages/EmergencyDispatch';
import ContractorPortal from './pages/ContractorPortal';
import PredictiveInsights from './pages/PredictiveInsights';
import GeoAnalytics from './pages/GeoAnalytics';
import GovChat from './pages/GovChat';
import NgoPortal from './pages/NgoPortal';

function GovRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'gov') return <Navigate to="/ngo" replace />;
  return <>{children}</>;
}

function NgoRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ngo') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'ngo') return <Navigate to="/ngo" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <RootRedirect /> : <LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Government Routes */}
      <Route path="/dashboard" element={<GovRoute><GovDashboard /></GovRoute>} />
      <Route path="/geo" element={<GovRoute><GeoAnalytics /></GovRoute>} />
      <Route path="/reports" element={<GovRoute><Reports /></GovRoute>} />
      <Route path="/settings" element={<AuthRoute><Settings /></AuthRoute>} />
      <Route path="/emergency-dispatch" element={<GovRoute><EmergencyDispatch /></GovRoute>} />
      <Route path="/contractors" element={<GovRoute><ContractorPortal /></GovRoute>} />
      <Route path="/predictive" element={<GovRoute><PredictiveInsights /></GovRoute>} />
      <Route path="/chat" element={<GovRoute><GovChat /></GovRoute>} />

      {/* NGO Route */}
      <Route path="/ngo" element={<NgoRoute><NgoPortal /></NgoRoute>} />

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
