import { format, parseISO } from 'date-fns';
import type { LayoutEvent } from '../../lib/layout';
import { MIN_EVENT_HEIGHT } from '../../lib/layout';
import { useCalendarContext } from '../../context/CalendarContext';

type EventBlockProps = {
  event: LayoutEvent;
  onClick: (e: LayoutEvent) => void;
};

export function EventBlock({ event, onClick }: EventBlockProps) {
  const { calendars } = useCalendarContext();
  const cal = calendars.find((c) => c.id === event.calendarId);
  const color = cal?.color ?? 'var(--clr-primary)';
  const completed = !!event.completedAt;

  const top = event.startMin; // 1px per minute
  const height = Math.max(event.durationMinutes, MIN_EVENT_HEIGHT);
  const left = `${(event.col / event.totalCols) * 100}%`;
  const width = `calc(${(1 / event.totalCols) * 100}% - 2px)`;

  const startLabel = format(parseISO(event.computedStartsAt), 'h:mm a');
  const short = height < 44; // not enough room for two lines

  return (
    <button
      className={`event-block${completed ? ' event-block--done' : ''}`}
      style={{
        top,
        height,
        left,
        width,
        borderLeftColor: color,
        background: `${color}18`,
      }}
      onClick={() => onClick(event)}
      aria-label={`${event.title} at ${startLabel}`}
    >
      <span className="event-block__title">{event.title}</span>
      {!short && <span className="event-block__time">{startLabel}</span>}
    </button>
  );
}
