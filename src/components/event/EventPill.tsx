import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { EventData } from '../../hooks/useEvents';
import { useCalendarContext } from '../../context/CalendarContext';

type EventPillProps = {
  event: EventData;
  onClick: (e: EventData) => void;
};

// Drop-target id prefix for "insert dragged event right before this pill".
// Recurring occurrences are synthetic (`${eventId}:${isoDate}`, not a real row)
// so they can't anchor a reorder — they stay drop-disabled same as drag-disabled.
export const PILL_DROP_PREFIX = 'pill:';

export function EventPill({ event, onClick }: EventPillProps) {
  const { calendars } = useCalendarContext();
  const cal = calendars.find((c) => c.id === event.calendarId);
  const color = cal?.color ?? 'var(--clr-primary)';
  const completed = !!event.completedAt;
  const isDraggable = !event.isOccurrence;

  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({
    id: event.id,
    disabled: !isDraggable,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `${PILL_DROP_PREFIX}${event.id}`,
    disabled: event.isOccurrence,
  });

  return (
    <button
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      className={[
        'event-pill',
        completed ? 'event-pill--done' : '',
        isDraggable ? 'event-pill--draggable' : '',
        isDragging ? 'event-pill--dragging' : '',
        isOver ? 'event-pill--drop-target' : '',
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
