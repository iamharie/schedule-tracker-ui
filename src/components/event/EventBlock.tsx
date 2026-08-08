import { format, parseISO } from 'date-fns';
import { useDraggable } from '@dnd-kit/core';
import type { LayoutEvent } from '../../lib/layout';
import { useCalendarContext } from '../../context/CalendarContext';
import { IconGripVertical } from '../ui/icons';

type EventBlockProps = {
  event: LayoutEvent;
  onClick: (e: LayoutEvent) => void;
  hourPx: number;
};

export function EventBlock({ event, onClick, hourPx }: EventBlockProps) {
  const { calendars } = useCalendarContext();
  const cal = calendars.find((c) => c.id === event.calendarId);
  const color = cal?.color ?? 'var(--clr-primary)';
  const completed = !!event.completedAt;
  const isDraggable = !event.isOccurrence;

  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: event.id,
    disabled: !isDraggable,
  });

  const minutePx = hourPx / 60;
  const top = event.startMin * minutePx;
  const height = Math.max(event.durationMinutes * minutePx, 24);
  const left = `${(event.col / event.totalCols) * 100}%`;
  const width = `calc(${(1 / event.totalCols) * 100}% - 2px)`;

  const startLabel = format(parseISO(event.computedStartsAt), 'h:mm a');
  const short = height < 44;

  return (
    <div
      ref={setNodeRef}
      className={[
        'event-block',
        completed ? 'event-block--done' : '',
        isDragging ? 'event-block--dragging' : '',
        isDraggable ? 'event-block--draggable' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ top, height, left, width, borderLeftColor: color, background: `${color}18` }}
      onClick={() => onClick(event)}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
    >
      <span className="event-block__title">{event.title}</span>
      {!short && <span className="event-block__time">{startLabel}</span>}
      {isDraggable && (
        <span className="drag-handle" aria-hidden>
          <IconGripVertical size={10} />
        </span>
      )}
    </div>
  );
}

export function EventGhost({
  event,
  color,
  hourPx,
}: {
  event: LayoutEvent;
  color: string;
  hourPx: number;
}) {
  const minutePx = hourPx / 60;
  const height = Math.max(event.durationMinutes * minutePx, 24);
  const startLabel = format(parseISO(event.computedStartsAt), 'h:mm a');
  return (
    <div
      className="event-block-ghost"
      style={{ height, borderLeftColor: color, background: `${color}18` }}
    >
      <span className="event-block__title">{event.title}</span>
      {height >= 44 && <span className="event-block__time">{startLabel}</span>}
    </div>
  );
}
