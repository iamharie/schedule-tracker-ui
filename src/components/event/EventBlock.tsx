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

  // Zooming in should make blocks easier to grab, not just taller — bigger
  // padding and a bigger grip icon give a larger, more precise drag target
  // without touching the column-width math (which reflects real overlaps).
  const roomy = hourPx >= 90;
  const handleSize = hourPx >= 120 ? 16 : hourPx >= 90 ? 14 : hourPx >= 60 ? 12 : 10;
  const blockPadding = hourPx >= 90 ? '4px var(--sp-3)' : hourPx >= 60 ? '3px var(--sp-2)' : '2px var(--sp-2)';

  return (
    <div
      ref={setNodeRef}
      className={[
        'event-block',
        completed ? 'event-block--done' : '',
        isDragging ? 'event-block--dragging' : '',
        isDraggable ? 'event-block--draggable' : '',
        roomy ? 'event-block--roomy' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        top,
        height,
        left,
        width,
        padding: blockPadding,
        borderLeftColor: color,
        background: `${color}18`,
      }}
      onClick={() => onClick(event)}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
    >
      <span className="event-block__title">{event.title}</span>
      {!short && <span className="event-block__time">{startLabel}</span>}
      {isDraggable && (
        <span className="drag-handle" aria-hidden>
          <IconGripVertical size={handleSize} />
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
