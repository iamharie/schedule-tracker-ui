import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, parseISO, isToday, isValid, startOfDay, endOfDay } from 'date-fns';
import { useCalendarContext } from '../context/CalendarContext';
import { useEvents, type EventData } from '../hooks/useEvents';
import { layoutTimedEvents, HOUR_PX } from '../lib/layout';
import { EventBlock } from '../components/event/EventBlock';
import { EventDetail } from '../components/event/EventDetail';
import type { LayoutEvent } from '../lib/layout';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export default function DayView() {
  const { date } = useParams<{ date: string }>();
  const { goToDate } = useCalendarContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const parsedDate = date ? parseISO(date) : new Date();
  const validDate = isValid(parsedDate) ? parsedDate : new Date();

  useEffect(() => {
    goToDate(validDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // Scroll to 7am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_PX;
    }
  }, [date]);

  const rangeStart = startOfDay(validDate);
  const rangeEnd = endOfDay(validDate);

  const { data, loading } = useEvents(rangeStart, rangeEnd);
  const events = data?.events ?? [];

  const allDayEvents = events.filter((e) => e.allDay);
  const timedEvents = layoutTimedEvents(events);

  // Current time indicator (only show if viewing today)
  const showNow = isToday(validDate);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const heading = isToday(validDate)
    ? `Today · ${format(validDate, 'MMMM d')}`
    : format(validDate, 'EEEE, MMMM d, yyyy');

  return (
    <>
      <div className="day-view-root">
        {/* All-day strip */}
        {allDayEvents.length > 0 && (
          <div className="allday-strip">
            <div className="allday-strip__label">All day</div>
            <div className="allday-strip__events">
              {allDayEvents.map((e) => (
                <button
                  key={e.id}
                  className="allday-event"
                  onClick={() => setSelectedEvent(e)}
                >
                  {e.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable timeline */}
        <div className="timeline-scroll" ref={scrollRef}>
          {/* Sticky day heading */}
          <div className="day-heading">
            <h2 className="day-heading__text">{heading}</h2>
          </div>

          <div
            className="timeline"
            style={{ height: 24 * HOUR_PX }}
            aria-label="Day timeline"
          >
            {/* Hour rows */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="timeline__hour"
                style={{ top: h * HOUR_PX }}
                aria-hidden
              >
                <span className="timeline__hour-label">{formatHour(h)}</span>
                <span className="timeline__hour-line" />
              </div>
            ))}

            {/* Current time indicator */}
            {showNow && (
              <div
                className="timeline__now"
                style={{ top: nowMin }}
                aria-label="Current time"
              />
            )}

            {/* Events */}
            <div className="timeline__events">
              {loading
                ? null
                : timedEvents.map((e) => (
                    <EventBlock
                      key={e.id}
                      event={e}
                      onClick={(ev: LayoutEvent) => setSelectedEvent(ev)}
                    />
                  ))}
            </div>
          </div>
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
