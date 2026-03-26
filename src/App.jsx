import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import useThemeStore from './stores/useThemeStore';
import { useAuthStore } from './stores/useAuthStore';
import { useStageStore } from './stores/useStageStore';
import { useAssessmentStore } from './stores/useAssessmentStore';
import { useMarketplaceStore } from './stores/useMarketplaceStore';
import { useBadgeStore } from './stores/useBadgeStore';

import BadgeNotification from './components/BadgeNotification';
import {
  fetchSharedStateBootstrap,
  flushPendingSharedStateSaves,
} from './lib/sharedStateClient';

const StudentLoginPage = lazy(() => import('./pages/StudentLoginPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function AppLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="rounded-2xl border border-white/10 bg-white/70 dark:bg-white/5 px-6 py-4 text-sm font-medium text-slate-600 dark:text-white/80 shadow-lg backdrop-blur-sm">
        Loading...
      </div>
    </div>
  );
}



function ProtectedRoute({ children, adminOnly }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/" />;
  if (adminOnly && user.role !== 'admin' && user.role !== 'subadmin') return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  const { isDark } = useThemeStore();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSharedState = async () => {
      try {
        await Promise.all([
          useAuthStore.persist?.rehydrate?.(),
          useStageStore.persist?.rehydrate?.(),
          useAssessmentStore.persist?.rehydrate?.(),
          useMarketplaceStore.persist?.rehydrate?.(),
          useBadgeStore.persist?.rehydrate?.(),
        ]);

        await useAuthStore.getState().loadSubAdminsFromServer?.();
        await useAuthStore.getState().loadStudentsFromServer?.();

        const sharedState = await fetchSharedStateBootstrap();

        if (Object.prototype.hasOwnProperty.call(sharedState, 'courses')) {
          useStageStore.getState().applyServerState?.(sharedState.courses);
        }
        useStageStore.getState().enableServerSync?.();

        if (Object.prototype.hasOwnProperty.call(sharedState, 'assessments')) {
          useAssessmentStore.getState().applyServerState?.(sharedState.assessments);
        }
        useAssessmentStore.getState().enableServerSync?.();

        if (Object.prototype.hasOwnProperty.call(sharedState, 'marketplace')) {
          useMarketplaceStore.getState().applyServerState?.(sharedState.marketplace);
        }
        useMarketplaceStore.getState().enableServerSync?.();

        if (Object.prototype.hasOwnProperty.call(sharedState, 'badges')) {
          useBadgeStore.getState().applyServerState?.(sharedState.badges);
        }
        useBadgeStore.getState().enableServerSync?.();
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrapSharedState();

    const handlePageHide = () => {
      void flushPendingSharedStateSaves();
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      isMounted = false;
      window.removeEventListener('pagehide', handlePageHide);
      void flushPendingSharedStateSaves();
    };
  }, []);

  if (isBootstrapping) {
    return (
      <HeroUIProvider>
        <div className={isDark ? 'dark' : ''} style={{ minHeight: '100vh' }}>
          <AppLoadingFallback />
        </div>
      </HeroUIProvider>
    );
  }

  return (
    <HeroUIProvider>
      <div className={isDark ? 'dark' : ''} style={{ minHeight: '100vh' }}>
        <BrowserRouter>
          <Suspense fallback={<AppLoadingFallback />}>
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
          </Suspense>
          <BadgeNotification />
        </BrowserRouter>
      </div>
    </HeroUIProvider>
  );
}
