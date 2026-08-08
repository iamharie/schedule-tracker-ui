import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { EventData, Priority } from '../../hooks/useEvents';
import { useDeleteEvent, useToggleComplete, useUpdateEvent } from '../../hooks/useMutations';
import { useMoveToTomorrow } from '../../hooks/useReorder';
import { PRIORITY_META } from '../../lib/layout';
import {
  IconX,
  IconClock,
  IconMapPin,
  IconAlignLeft,
  IconTrash,
  IconCheck,
  IconEdit,
  IconChevronRight,
} from '../ui/icons';

type EventDetailProps = {
  event: EventData;
  onClose: () => void;
};

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'NICE_TO_DO', label: 'Nice to do' },
];

export function EventDetail({ event, onClose }: EventDetailProps) {
  const { deleteEvent, loading: deleting } = useDeleteEvent();
  const { toggleComplete } = useToggleComplete();
  const { moveToTomorrow, loading: moving } = useMoveToTomorrow();
  const [editing, setEditing] = useState(false);

  const meta = PRIORITY_META[event.priority];
  const color = `var(${meta.varClr})`;

  const start = parseISO(event.computedStartsAt);
  const endMs = start.getTime() + event.durationMinutes * 60_000;
  const end = new Date(endMs);

  const timeLabel = event.allDay
    ? 'All day'
    : `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;

  const dateLabel = format(start, 'EEEE, MMMM d, yyyy');

  const completed = !!event.completedAt;
  const canEdit = !event.isOccurrence;

  async function handleDelete() {
    await deleteEvent(event.id);
    onClose();
  }

  async function handleToggle() {
    await toggleComplete(event.id);
    onClose();
  }

  async function handleMoveToTomorrow() {
    await moveToTomorrow(event);
    onClose();
  }

  if (editing) {
    return (
      <EditEventForm event={event} onCancel={() => setEditing(false)} onSaved={onClose} />
    );
  }

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet" role="dialog" aria-modal aria-label={event.title}>
        <div className="bottom-sheet__handle" />

        <div className="bottom-sheet__header">
          <div
            className="bottom-sheet__priority-dot"
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
          {canEdit && (
            <button className="action-btn action-btn--ghost" onClick={() => setEditing(true)}>
              <IconEdit size={16} />
              Edit
            </button>
          )}
          <button
            className={`action-btn action-btn--ghost${completed ? ' action-btn--active' : ''}`}
            onClick={handleToggle}
          >
            <IconCheck size={16} />
            {completed ? 'Mark incomplete' : 'Mark complete'}
          </button>
          {canEdit && (
            <button
              className="action-btn action-btn--ghost"
              onClick={handleMoveToTomorrow}
              disabled={moving}
            >
              <IconChevronRight size={16} />
              {moving ? 'Moving…' : 'Move to tomorrow'}
            </button>
          )}
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

type EditEventFormProps = {
  event: EventData;
  onCancel: () => void;
  onSaved: () => void;
};

function EditEventForm({ event, onCancel, onSaved }: EditEventFormProps) {
  const { updateEvent, loading } = useUpdateEvent();

  const eventStart = parseISO(event.startsAt);
  const eventEnd = new Date(eventStart.getTime() + event.durationMinutes * 60_000);

  const [title, setTitle] = useState(event.title);
  const [notes, setNotes] = useState(event.notes ?? '');
  const [location, setLocation] = useState(event.location ?? '');
  const [priority, setPriority] = useState<Priority>(event.priority);
  const [isAnchored, setIsAnchored] = useState(event.isAnchored);
  const [startTime, setStartTime] = useState(format(eventStart, 'HH:mm'));
  const [endTime, setEndTime] = useState(format(eventEnd, 'HH:mm'));
  const [durationMinutes, setDurationMinutes] = useState(event.durationMinutes);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }

    let startsAt: string | undefined;
    let newDuration: number | undefined;

    if (isAnchored) {
      // Time-only edit — keep the event's existing calendar day, just change
      // the clock time, built in local time so it doesn't drift a UTC offset.
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const newStart = new Date(eventStart);
      newStart.setHours(sh, sm, 0, 0);
      const newEnd = new Date(eventStart);
      newEnd.setHours(eh, em, 0, 0);

      const diff = Math.round((newEnd.getTime() - newStart.getTime()) / 60_000);
      if (diff < 5) { setError('End time must be after start time'); return; }

      startsAt = newStart.toISOString();
      newDuration = diff;
    } else {
      if (durationMinutes < 5) { setError('Duration must be at least 5 minutes'); return; }
      newDuration = durationMinutes;
    }

    try {
      await updateEvent(event.id, {
        title: title.trim(),
        notes: notes.trim() || null,
        location: location.trim() || null,
        priority,
        isAnchored,
        startsAt,
        durationMinutes: newDuration,
      });
      onSaved();
    } catch {
      setError('Failed to save changes');
    }
  }

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onCancel} />
      <div className="bottom-sheet" role="dialog" aria-modal aria-label={`Edit ${event.title}`}>
        <div className="bottom-sheet__handle" />

        <div className="bottom-sheet__header">
          <h2 className="bottom-sheet__title">Edit Event</h2>
          <button className="icon-btn" onClick={onCancel} aria-label="Cancel">
            <IconX size={20} />
          </button>
        </div>

        <form className="bottom-sheet__body" onSubmit={handleSubmit} noValidate>
          <input
            className={`qc-title-input${error ? ' qc-title-input--error' : ''}`}
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            aria-label="Event title"
            maxLength={120}
          />
          {error && <p className="qc-error">{error}</p>}

          <input
            className="qc-title-input"
            type="text"
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            aria-label="Location"
          />

          <textarea
            className="qc-title-input qc-textarea"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="Notes"
            rows={3}
          />

          <div className="qc-row">
            <label className="qc-label" htmlFor="edit-anchored">Fixed time</label>
            <button
              id="edit-anchored"
              type="button"
              className={`toggle-switch${isAnchored ? ' toggle-switch--on' : ''}`}
              onClick={() => setIsAnchored((v) => !v)}
              aria-pressed={isAnchored}
            >
              <span className="toggle-switch__thumb" />
            </button>
          </div>

          {isAnchored ? (
            <div className="qc-time-range">
              <label className="qc-label" htmlFor="edit-start">Start</label>
              <input
                id="edit-start"
                className="qc-time-input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <label className="qc-label" htmlFor="edit-end">End</label>
              <input
                id="edit-end"
                className="qc-time-input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          ) : (
            <div className="qc-row">
              <label className="qc-label" htmlFor="edit-duration">Duration (min)</label>
              <input
                id="edit-duration"
                className="qc-time-input"
                type="number"
                min={5}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>
          )}

          <div className="qc-priority-group" role="group" aria-label="Priority">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`priority-chip${priority === p.value ? ' priority-chip--active' : ''}`}
                data-priority={p.value}
                onClick={() => setPriority(p.value)}
                aria-pressed={priority === p.value}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button type="submit" className="action-btn action-btn--primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </>
  );
}
