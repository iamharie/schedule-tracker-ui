import { useNavigate } from 'react-router-dom';
import {
  startOfYear,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from 'date-fns';
import { useCalendarContext } from '../context/CalendarContext';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type MiniMonthProps = {
  monthStart: Date;
  onSelectMonth: (d: Date) => void;
};

// The whole card navigates to Month view — Year view is month-level only, no
// day-level navigation (that's Month view's job), so day cells are plain,
// non-interactive text, not buttons.
function MiniMonth({ monthStart, onSelectMonth }: MiniMonthProps) {
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <button
      className="mini-month"
      onClick={() => onSelectMonth(monthStart)}
      aria-label={`Go to ${format(monthStart, 'MMMM yyyy')}`}
    >
      <span className="mini-month__label">{format(monthStart, 'MMMM')}</span>

      <span className="mini-month__dow-row" aria-hidden>
        {DOW.map((d, i) => (
          <span key={i} className="mini-month__dow">{d}</span>
        ))}
      </span>

      <span className="mini-month__grid" aria-hidden>
        {days.map((day) => {
          const inMonth = isSameMonth(day, monthStart);
          const today = isToday(day);
          return (
            <span
              key={day.toISOString()}
              className={`mini-month__day${!inMonth ? ' mini-month__day--blank' : ''}${today ? ' mini-month__day--today' : ''}`}
            >
              {inMonth ? format(day, 'd') : ''}
            </span>
          );
        })}
      </span>
    </button>
  );
}

export default function YearView() {
  const { activeDate, goToDate } = useCalendarContext();
  const navigate = useNavigate();

  const yearStart = startOfYear(activeDate);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));

  function handleSelectMonth(monthStart: Date) {
    goToDate(startOfMonth(monthStart));
    navigate('/');
  }

  return (
    <div className="year-view">
      <div className="year-view__grid">
        {months.map((m) => (
          <MiniMonth key={m.toISOString()} monthStart={m} onSelectMonth={handleSelectMonth} />
        ))}
      </div>
    </div>
  );
}
