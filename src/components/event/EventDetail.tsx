import { format, parseISO } from 'date-fns';
import type { EventData } from '../../hooks/useEvents';
import { useDeleteEvent, useToggleComplete } from '../../hooks/useMutations';
import { useCalendarContext } from '../../context/CalendarContext';
import { PRIORITY_META } from '../../lib/layout';
import { IconX, IconClock, IconMapPin, IconAlignLeft, IconTrash, IconCheck } from '../ui/icons';

type EventDetailProps = {
  event: EventData;
  onClose: () => void;
};

export function EventDetail({ event, onClose }: EventDetailProps) {
  const { calendars } = useCalendarContext();
  const { deleteEvent, loading: deleting } = useDeleteEvent();
  const { toggleComplete } = useToggleComplete();

  const cal = calendars.find((c) => c.id === event.calendarId);
  const color = cal?.color ?? 'var(--clr-primary)';

  const start = parseISO(event.computedStartsAt);
  const endMs = start.getTime() + event.durationMinutes * 60_000;
  const end = new Date(endMs);

  const timeLabel = event.allDay
    ? 'All day'
    : `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;

  const dateLabel = format(start, 'EEEE, MMMM d, yyyy');

  const meta = PRIORITY_META[event.priority];
  const completed = !!event.completedAt;

  async function handleDelete() {
    await deleteEvent(event.id);
    onClose();
  }

  async function handleToggle() {
    await toggleComplete(event.id);
    onClose();
  }

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet" role="dialog" aria-modal aria-label={event.title}>
        <div className="bottom-sheet__handle" />

        <div className="bottom-sheet__header">
          <div
            className="bottom-sheet__cal-dot"
            style={{ background: color }}
            aria-hidden
          />
          <h2 className={`bottom-sheet__title${completed ? ' bottom-sheet__title--done' : ''}`}>
            {event.title}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={20} />
          </button>
        </div>

        <div className="bottom-sheet__body">
          {/* Priority badge */}
          <div className="detail-row">
            <span
              className="priority-badge"
              style={{
                background: `var(${meta.varBg})`,
                color: `var(${meta.varClr})`,
              }}
            >
              {meta.label}
            </span>
          </div>

          {/* Date + time */}
          <div className="detail-row">
            <IconClock size={16} />
            <span>{dateLabel}</span>
          </div>
          <div className="detail-row detail-row--indent">
            <span>{timeLabel}</span>
          </div>

          {event.location && (
            <div className="detail-row">
              <IconMapPin size={16} />
              <span>{event.location}</span>
            </div>
          )}

          {event.notes && (
            <div className="detail-row detail-row--top">
              <IconAlignLeft size={16} />
              <span className="detail-notes">{event.notes}</span>
            </div>
          )}
        </div>

        <div className="bottom-sheet__actions">
          <button
            className={`action-btn action-btn--ghost${completed ? ' action-btn--active' : ''}`}
            onClick={handleToggle}
          >
            <IconCheck size={16} />
            {completed ? 'Mark incomplete' : 'Mark complete'}
          </button>
          <button
            className="action-btn action-btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            <IconTrash size={16} />
            Delete
          </button>
        </div>
      </div>
    </>
  );
}
