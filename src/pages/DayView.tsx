import { useParams } from 'react-router-dom';
import { format, parseISO, isToday, isValid } from 'date-fns';
import { useCalendarContext } from '../context/CalendarContext';
import { useEffect } from 'react';

export default function DayView() {
  const { date } = useParams<{ date: string }>();
  const { goToDate } = useCalendarContext();

  const parsedDate = date ? parseISO(date) : new Date();
  const validDate = isValid(parsedDate) ? parsedDate : new Date();

  // Keep the context in sync when navigating directly to a date URL
  useEffect(() => {
    goToDate(validDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const heading = isToday(validDate)
    ? `Today · ${format(validDate, 'MMMM d')}`
    : format(validDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="day-view">
      <h2 className="day-view__heading">{heading}</h2>
      <p className="day-view__sub">Events coming in Phase 5.</p>
    </div>
  );
}
