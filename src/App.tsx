import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CalendarProvider } from './context/CalendarContext';
import { AppShell } from './components/AppShell/AppShell';
import { Skeleton } from './components/ui/Skeleton';

const MonthView = lazy(() => import('./pages/MonthView'));
const DayView = lazy(() => import('./pages/DayView'));

function PageFallback() {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} height={80} borderRadius="8px" />
      ))}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CalendarProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<MonthView />} />
              <Route path="day/:date" element={<DayView />} />
              {/* quick-create placeholder — Phase 5 will render a bottom sheet */}
              <Route path="quick-create" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </CalendarProvider>
    </BrowserRouter>
  );
}
