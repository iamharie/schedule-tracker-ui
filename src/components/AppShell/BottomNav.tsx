import { NavLink, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useCalendarContext } from '../../context/CalendarContext';
import { IconCalendar, IconList, IconPlus } from '../ui/icons';

export function BottomNav() {
  const { activeDate } = useCalendarContext();
  const navigate = useNavigate();

  const dayPath = `/day/${format(activeDate, 'yyyy-MM-dd')}`;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `bottom-nav__tab${isActive ? ' bottom-nav__tab--active' : ''}`
        }
        aria-label="Month view"
      >
        <IconCalendar size={22} />
        <span className="bottom-nav__label">Month</span>
      </NavLink>

      <button
        className="bottom-nav__fab"
        onClick={() => navigate('/quick-create')}
        aria-label="Quick add event"
      >
        <IconPlus size={24} />
      </button>

      <NavLink
        to={dayPath}
        className={({ isActive }) =>
          `bottom-nav__tab${isActive ? ' bottom-nav__tab--active' : ''}`
        }
        aria-label="Day view"
      >
        <IconList size={22} />
        <span className="bottom-nav__label">Day</span>
      </NavLink>
    </nav>
  );
}
