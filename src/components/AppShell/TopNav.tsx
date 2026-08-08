import { format } from 'date-fns';
import { useCalendarContext } from '../../context/CalendarContext';
import { IconChevronLeft, IconChevronRight, IconMenu } from '../ui/icons';

type TopNavProps = { onMenuClick: () => void };

export function TopNav({ onMenuClick }: TopNavProps) {
  const { activeDate, prevMonth, nextMonth, goToToday } = useCalendarContext();

  return (
    <header className="top-nav">
      <button className="icon-btn top-nav__menu-btn" onClick={onMenuClick} aria-label="Open calendar list">
        <IconMenu size={22} />
      </button>

      <div className="top-nav__heading">
        <button className="icon-btn" onClick={prevMonth} aria-label="Previous month">
          <IconChevronLeft />
        </button>
        <button
          className="top-nav__title"
          onClick={goToToday}
          aria-label="Go to today"
          style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
        >
          {format(activeDate, 'MMMM yyyy')}
        </button>
        <button className="icon-btn" onClick={nextMonth} aria-label="Next month">
          <IconChevronRight />
        </button>
      </div>

      {/* spacer to balance the menu button */}
      <div className="top-nav__spacer" style={{ width: 40 }} />
    </header>
  );
}
