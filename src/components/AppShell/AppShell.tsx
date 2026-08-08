import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';
import { useCalendarContext, type CalendarSummary } from '../../context/CalendarContext';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { CalendarDrawer } from './CalendarDrawer';

const CALENDARS_QUERY = gql`
  query Calendars {
    calendars {
      id
      name
      color
      isDefault
    }
  }
`;

type CalendarsData = { calendars: CalendarSummary[] };

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { setCalendars } = useCalendarContext();

  const { data, loading } = useQuery<CalendarsData>(CALENDARS_QUERY, {
    // If the user isn't logged in the server returns [] — no error to handle
    errorPolicy: 'ignore',
  });

  useEffect(() => {
    if (data?.calendars) setCalendars(data.calendars);
  }, [data, setCalendars]);

  return (
    <div className="app-shell">
      <TopNav onMenuClick={() => setDrawerOpen(true)} />

      <main className="app-content">
        <Outlet />
      </main>

      <BottomNav />

      <CalendarDrawer
        open={drawerOpen}
        loading={loading}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
