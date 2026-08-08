import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { CalendarProvider } from './context/CalendarContext';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { AppShell } from './components/AppShell/AppShell';
import { Skeleton } from './components/ui/Skeleton';

const MonthView = lazy(() => import('./pages/MonthView'));
const DayView = lazy(() => import('./pages/DayView'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

function PageFallback() {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} height={80} borderRadius="8px" />
      ))}
    </div>
  );
}

function AuthLoading() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--clr-bg)',
      }}
    >
      <p style={{ color: 'var(--clr-text-muted)', fontSize: '15px' }}>Loading…</p>
    </div>
  );
}

function RequireAuth() {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CalendarProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes */}
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route index element={<MonthView />} />
                  <Route path="day/:date" element={<DayView />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </CalendarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
