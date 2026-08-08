import { format } from 'date-fns';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCalendarContext, type Theme } from '../../context/CalendarContext';
import { useAuthContext } from '../../context/AuthContext';
import { IconCalendar, IconList, IconPlus, IconCheck } from '../ui/icons';
import { Skeleton } from '../ui/Skeleton';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'Auto' },
  { value: 'dark', label: 'Dark' },
];

type DesktopSidebarProps = { onAdd: () => void; calendarsLoading: boolean };

export function DesktopSidebar({ onAdd, calendarsLoading }: DesktopSidebarProps) {
  const { calendars, selectedIds, toggleCalendar, theme, setTheme, activeDate } =
    useCalendarContext();
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const dayPath = `/day/${format(activeDate, 'yyyy-MM-dd')}`;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="desktop-sidebar">
      <div className="desktop-sidebar__brand">
        <span className="desktop-sidebar__brand-name">Schedule Tracker</span>
      </div>

      <nav className="desktop-sidebar__nav" aria-label="Main">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `desktop-sidebar__nav-link${isActive ? ' desktop-sidebar__nav-link--active' : ''}`
          }
        >
          <IconCalendar size={17} />
          Month
        </NavLink>
        <NavLink
          to={dayPath}
          className={({ isActive }) =>
            `desktop-sidebar__nav-link${isActive ? ' desktop-sidebar__nav-link--active' : ''}`
          }
        >
          <IconList size={17} />
          Day
        </NavLink>
      </nav>

      <button className="desktop-sidebar__add" onClick={onAdd} aria-label="Quick add event">
        <IconPlus size={15} />
        Add event
      </button>

      <p className="desktop-sidebar__section-label">My Calendars</p>

      <ul className="desktop-sidebar__cals" role="list">
        {calendarsLoading
          ? Array.from({ length: 2 }, (_, i) => (
              <li key={i} className="desktop-sidebar__cal-item">
                <Skeleton width={10} height={10} borderRadius="50%" />
                <Skeleton width={100} height={13} />
              </li>
            ))
          : calendars.map((cal) => {
              const on = selectedIds.has(cal.id);
              return (
                <li key={cal.id}>
                  <button
                    className="desktop-sidebar__cal-btn"
                    onClick={() => toggleCalendar(cal.id)}
                    aria-pressed={on}
                  >
                    <span
                      className="desktop-sidebar__swatch"
                      style={{ background: cal.color }}
                    />
                    <span className="desktop-sidebar__cal-name">{cal.name}</span>
                    {on && <IconCheck size={12} />}
                  </button>
                </li>
              );
            })}
      </ul>

      <div className="desktop-sidebar__footer">
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

        {user && (
          <div className="desktop-sidebar__account">
            <span className="desktop-sidebar__email">{user.email}</span>
            <button className="drawer__logout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
