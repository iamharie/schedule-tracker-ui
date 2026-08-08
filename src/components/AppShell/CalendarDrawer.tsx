import { useEffect } from 'react';
import { useCalendarContext, type Theme } from '../../context/CalendarContext';
import { IconCheck } from '../ui/icons';
import { Skeleton } from '../ui/Skeleton';

type CalendarDrawerProps = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
};

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'Auto' },
  { value: 'dark', label: 'Dark' },
];

export function CalendarDrawer({ open, loading, onClose }: CalendarDrawerProps) {
  const { calendars, selectedIds, toggleCalendar, theme, setTheme } = useCalendarContext();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden />
      <aside className="drawer" aria-label="Calendar list">
        <div className="drawer__header">
          <p className="drawer__title">My Calendars</p>
        </div>

        <ul className="drawer__list" role="list">
          {loading
            ? Array.from({ length: 3 }, (_, i) => (
                <li key={i} style={{ padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Skeleton width={14} height={14} borderRadius="50%" />
                  <Skeleton width={120} height={14} />
                </li>
              ))
            : calendars.map((cal) => {
                const on = selectedIds.has(cal.id);
                return (
                  <li key={cal.id}>
                    <button className="drawer__item" onClick={() => toggleCalendar(cal.id)}>
                      <span className="drawer__swatch" style={{ background: cal.color }} />
                      <span className="drawer__cal-name">{cal.name}</span>
                      <span className={`drawer__check${on ? ' drawer__check--on' : ''}`} aria-checked={on} role="checkbox">
                        {on && <IconCheck size={12} />}
                      </span>
                    </button>
                  </li>
                );
              })}
        </ul>

        <div className="drawer__footer">
          <div className="theme-row">
            <span className="theme-row__label">Theme</span>
            <div className="theme-toggle" role="group" aria-label="Theme">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  className={`theme-toggle__btn${theme === t.value ? ' theme-toggle__btn--active' : ''}`}
                  onClick={() => setTheme(t.value)}
                  aria-pressed={theme === t.value}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
