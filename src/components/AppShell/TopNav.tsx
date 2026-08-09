import { useState } from 'react';
import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCalendarContext } from '../../context/CalendarContext';
import { IconChevronLeft, IconChevronRight, IconMenu, IconGrid, IconRefresh } from '../ui/icons';

type TopNavProps = { onMenuClick: () => void };

export function TopNav({ onMenuClick }: TopNavProps) {
  const { activeDate, prevMonth, nextMonth, prevYear, nextYear, goToToday } = useCalendarContext();
  const location = useLocation();
  const navigate = useNavigate();
  const isYearView = location.pathname === '/year';
  const [refreshing, setRefreshing] = useState(false);

  // A real hard reload, not a query refetch — installed as a home-screen/dock
  // app, there's no browser chrome to pull-to-refresh or reload from, and
  // there's no realtime sync, so this is the one action that's guaranteed to
  // clear every kind of staleness (Apollo cache, auth, UI state) at once.
  function handleRefresh() {
    setRefreshing(true);
    // Reload is effectively instant — this tiny delay just gives the browser
    // a chance to paint the spin feedback first, so the tap visibly registers
    // before the screen tears down, instead of possibly reloading before a
    // single frame renders.
    setTimeout(() => window.location.reload(), 150);
  }

  return (
    <header className="top-nav">
      <button className="icon-btn top-nav__menu-btn" onClick={onMenuClick} aria-label="Open calendar list">
        <IconMenu size={22} />
      </button>

      <div className="top-nav__heading">
        <button
          className="icon-btn"
          onClick={isYearView ? prevYear : prevMonth}
          aria-label={isYearView ? 'Previous year' : 'Previous month'}
        >
          <IconChevronLeft />
        </button>
        <button className="top-nav__title" onClick={goToToday} aria-label="Go to today">
          {isYearView ? format(activeDate, 'yyyy') : format(activeDate, 'MMMM yyyy')}
        </button>
        <button
          className="icon-btn"
          onClick={isYearView ? nextYear : nextMonth}
          aria-label={isYearView ? 'Next year' : 'Next month'}
        >
          <IconChevronRight />
        </button>
      </div>

      <div className="top-nav__actions">
        {/* No realtime updates and no browser chrome in installed/standalone
            mode — this is the only way to force a full refresh. Visible on
            both mobile and desktop, unlike the year-view shortcut below. */}
        <button
          className={`icon-btn${refreshing ? ' icon-btn--spinning' : ''}`}
          onClick={handleRefresh}
          aria-label="Refresh"
        >
          <IconRefresh size={19} />
        </button>

        {/* Entry point to Year view, mirroring tapping the title in Apple
            Calendar. Hidden on desktop — the sidebar has its own Year link. */}
        <button
          className="icon-btn top-nav__year-btn"
          onClick={() => navigate(isYearView ? '/' : '/year')}
          aria-label={isYearView ? 'Back to month view' : 'Year view'}
        >
          <IconGrid size={20} />
        </button>
      </div>
    </header>
  );
}
