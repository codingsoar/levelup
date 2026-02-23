import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import useThemeStore from './stores/useThemeStore';
import { useAuthStore } from './stores/useAuthStore';
import StudentLoginPage from './pages/StudentLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import ProfilePage from './pages/ProfilePage';
import StudentProfilePage from './pages/StudentProfilePage';
import MarketplacePage from './pages/MarketplacePage';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children, adminOnly }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <HeroUIProvider>
      <div className={isDark ? 'dark' : ''} style={{ minHeight: '100vh' }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<StudentLoginPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><StudentDashboardPage /></ProtectedRoute>} />
            <Route path="/student-profile" element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </div>
    </HeroUIProvider>
  );
}
