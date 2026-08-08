import { useRef, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useCalendarContext } from '../../context/CalendarContext';
import { useQuickCreate } from '../../hooks/useMutations';
import type { Priority } from '../../hooks/useEvents';
import { IconX } from '../ui/icons';

type QuickCreateProps = { onClose: () => void };

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'NICE_TO_DO', label: 'Nice to do' },
];

export function QuickCreate({ onClose }: QuickCreateProps) {
  const { activeDate, calendars } = useCalendarContext();
  const { quickCreate, loading } = useQuickCreate();
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [isAnchored, setIsAnchored] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }

    const dateStr = format(activeDate, 'yyyy-MM-dd');
    const startsAt = isAnchored ? `${dateStr}T${time}:00.000Z` : undefined;

    try {
      await quickCreate({
        title: title.trim(),
        date: `${dateStr}T00:00:00.000Z`,
        startsAt,
        priority,
        isAnchored,
        calendarId: calendars.find((c) => c.isDefault)?.id,
      });
      onClose();
    } catch {
      setError('Failed to create event. Are you logged in?');
    }
  }

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet" role="dialog" aria-modal aria-label="New event">
        <div className="bottom-sheet__handle" />

        <div className="bottom-sheet__header">
          <h2 className="bottom-sheet__title">New Event</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={20} />
          </button>
        </div>

        <form className="bottom-sheet__body" onSubmit={handleSubmit} noValidate>
          <div className="qc-date-label">
            {format(activeDate, 'EEEE, MMMM d')}
          </div>

          <input
            ref={titleRef}
            className={`qc-title-input${error ? ' qc-title-input--error' : ''}`}
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            aria-label="Event title"
            maxLength={120}
          />
          {error && <p className="qc-error">{error}</p>}

          <div className="qc-row">
            <label className="qc-label" htmlFor="qc-anchored">Fixed time</label>
            <button
              id="qc-anchored"
              type="button"
              className={`toggle-switch${isAnchored ? ' toggle-switch--on' : ''}`}
              onClick={() => setIsAnchored((v) => !v)}
              aria-pressed={isAnchored}
            >
              <span className="toggle-switch__thumb" />
            </button>
          </div>

          {isAnchored && (
            <div className="qc-row">
              <label className="qc-label" htmlFor="qc-time">Start time</label>
              <input
                id="qc-time"
                className="qc-time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
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

          <button
            type="submit"
            className="action-btn action-btn--primary"
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create Event'}
          </button>
        </form>
      </div>
    </>
  );
}
