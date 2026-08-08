import { useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  format,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useCalendarContext } from '../context/CalendarContext';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKEND = new Set([0, 6]);

export default function MonthView() {
  const { activeDate, goToDate } = useCalendarContext();
  const navigate = useNavigate();

  const monthStart = startOfMonth(activeDate);
  const monthEnd = endOfMonth(activeDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // How many weeks in the grid (4, 5, or 6)
  const weekCount = days.length / 7;

  const handleDayClick = useCallback(
    (day: Date) => {
      goToDate(day);
      navigate(`/day/${format(day, 'yyyy-MM-dd')}`);
    },
    [goToDate, navigate],
  );

  return (
    <div className="month-grid" style={{ '--week-count': weekCount } as React.CSSProperties}>
      <div className="month-grid__dow-row" aria-hidden>
        {DOW.map((d, i) => (
          <div key={d} className={`month-grid__dow${WEEKEND.has(i) ? ' month-grid__dow--weekend' : ''}`}>
            {d}
          </div>
        ))}
      </div>

      <div className="month-grid__weeks">
        {Array.from({ length: weekCount }, (_, wi) => (
          <div key={wi} className="month-grid__week">
            {days.slice(wi * 7, wi * 7 + 7).map((day) => {
              const inMonth = isSameMonth(day, activeDate);
              const today = isToday(day);
              const selected = isSameDay(day, activeDate);

              let cls = 'month-grid__day';
              if (!inMonth) cls += ' month-grid__day--other-month';
              if (today) cls += ' month-grid__day--today';
              else if (selected) cls += ' month-grid__day--selected';

              return (
                <button
                  key={day.toISOString()}
                  className={cls}
                  onClick={() => handleDayClick(day)}
                  aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                  aria-current={today ? 'date' : undefined}
                  aria-pressed={selected && !today ? true : undefined}
                >
                  <span className="month-grid__day-num" aria-hidden>
                    {format(day, 'd')}
                  </span>
                  {/* Phase 5 will render event pills here */}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
