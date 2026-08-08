import { useCallback, useMemo, useState } from 'react';
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
  addDays,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useCalendarContext } from '../context/CalendarContext';
import { useEvents, type EventData } from '../hooks/useEvents';
import { groupByLocalDate } from '../lib/layout';
import { EventPill } from '../components/event/EventPill';
import { EventDetail } from '../components/event/EventDetail';
import { Skeleton } from '../components/ui/Skeleton';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKEND = new Set([0, 6]);
const MAX_PILLS = 3;

export default function MonthView() {
  const { activeDate, goToDate } = useCalendarContext();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const monthStart = startOfMonth(activeDate);
  const monthEnd = endOfMonth(activeDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekCount = days.length / 7;

  // Query the full grid range (includes days from adjacent months)
  const { data, loading } = useEvents(gridStart, addDays(gridEnd, 1));
  const eventsByDay = useMemo(
    () => groupByLocalDate(data?.events ?? []),
    [data],
  );

  const handleDayClick = useCallback(
    (day: Date) => {
      goToDate(day);
      navigate(`/day/${format(day, 'yyyy-MM-dd')}`);
    },
    [goToDate, navigate],
  );

  return (
    <>
      <div className="month-grid" style={{ '--week-count': weekCount } as React.CSSProperties}>
        <div className="month-grid__dow-row" aria-hidden>
          {DOW.map((d, i) => (
            <div
              key={d}
              className={`month-grid__dow${WEEKEND.has(i) ? ' month-grid__dow--weekend' : ''}`}
            >
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
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayEvents = (eventsByDay.get(dayKey) ?? []).sort((a, b) =>
                  a.computedStartsAt.localeCompare(b.computedStartsAt),
                );
                const overflow = Math.max(0, dayEvents.length - MAX_PILLS);

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
                  >
                    <span className="month-grid__day-num" aria-hidden>
                      {format(day, 'd')}
                    </span>

                    {loading ? (
                      <Skeleton height={14} borderRadius="4px" />
                    ) : (
                      <>
                        {dayEvents.slice(0, MAX_PILLS).map((ev) => (
                          <EventPill
                            key={ev.id}
                            event={ev}
                            onClick={(e) => {
                              setSelectedEvent(e);
                            }}
                          />
                        ))}
                        {overflow > 0 && (
                          <span className="month-grid__overflow">+{overflow}</span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}
