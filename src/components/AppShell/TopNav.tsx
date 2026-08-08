import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCalendarContext } from '../../context/CalendarContext';
import { IconChevronLeft, IconChevronRight, IconMenu, IconGrid } from '../ui/icons';

type TopNavProps = { onMenuClick: () => void };

export function TopNav({ onMenuClick }: TopNavProps) {
  const { activeDate, prevMonth, nextMonth, prevYear, nextYear, goToToday } = useCalendarContext();
  const location = useLocation();
  const navigate = useNavigate();
  const isYearView = location.pathname === '/year';

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

      {/* Entry point to Year view, mirroring tapping the title in Apple Calendar.
          Hidden on desktop — the sidebar has its own Year nav link there. */}
      <button
        className="icon-btn top-nav__year-btn"
        onClick={() => navigate(isYearView ? '/' : '/year')}
        aria-label={isYearView ? 'Back to month view' : 'Year view'}
      >
        <IconGrid size={20} />
      </button>
    </header>
  );
}
