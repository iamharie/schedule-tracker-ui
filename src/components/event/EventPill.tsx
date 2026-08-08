import type { EventData } from '../../hooks/useEvents';
import { useCalendarContext } from '../../context/CalendarContext';

type EventPillProps = {
  event: EventData;
  onClick: (e: EventData) => void;
};

export function EventPill({ event, onClick }: EventPillProps) {
  const { calendars } = useCalendarContext();
  const cal = calendars.find((c) => c.id === event.calendarId);
  const color = cal?.color ?? 'var(--clr-primary)';
  const completed = !!event.completedAt;

  return (
    <button
      className={`event-pill${completed ? ' event-pill--done' : ''}`}
      style={{ borderLeftColor: color }}
      onClick={(ev) => { ev.stopPropagation(); onClick(event); }}
      aria-label={event.title}
    >
      <span className="event-pill__dot" style={{ background: color }} />
      <span className="event-pill__title">{event.title}</span>
    </button>
  );
}
