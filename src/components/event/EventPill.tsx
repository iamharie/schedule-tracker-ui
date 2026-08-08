import { useDraggable } from '@dnd-kit/core';
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
  const isDraggable = !event.isOccurrence;

  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: event.id,
    disabled: !isDraggable,
  });

  return (
    <button
      ref={setNodeRef}
      className={[
        'event-pill',
        completed ? 'event-pill--done' : '',
        isDraggable ? 'event-pill--draggable' : '',
        isDragging ? 'event-pill--dragging' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ borderLeftColor: color }}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
      onClick={() => onClick(event)}
      aria-label={event.title}
    >
      <span className="event-pill__dot" style={{ background: color }} />
      <span className="event-pill__title">{event.title}</span>
    </button>
  );
}
