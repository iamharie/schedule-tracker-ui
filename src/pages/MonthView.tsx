import { useCallback, useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  format,
  addDays,
  parseISO,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensors,
  useSensor,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useCalendarContext } from '../context/CalendarContext';
import { useEvents, type EventData } from '../hooks/useEvents';
import { useUpdateEventTime } from '../hooks/useMutations';
import { groupByLocalDate } from '../lib/layout';
import { EventPill } from '../components/event/EventPill';
import { EventDetail } from '../components/event/EventDetail';
import { Skeleton } from '../components/ui/Skeleton';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKEND = new Set([0, 6]);
const MAX_PILLS = 3;

// Each day cell is a droppable target
function DroppableDay({
  dateKey,
  className,
  children,
}: {
  dateKey: string;
  className: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `drop-${dateKey}` });
  return (
    <div
      ref={setNodeRef}
      className={`${className}${isOver ? ' month-grid__day--drop-target' : ''}`}
    >
      {children}
    </div>
  );
}

// Lightweight ghost shown in DragOverlay while dragging
function PillGhost({ event }: { event: EventData }) {
  const { calendars } = useCalendarContext();
  const color = calendars.find((c) => c.id === event.calendarId)?.color ?? 'var(--clr-primary)';
  return (
    <div className="event-pill event-pill--ghost" style={{ borderLeftColor: color }}>
      <span className="event-pill__dot" style={{ background: color }} />
      <span className="event-pill__title">{event.title}</span>
    </div>
  );
}

export default function MonthView() {
  const { activeDate, goToDate } = useCalendarContext();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { updateEventTime } = useUpdateEventTime();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const monthStart = startOfMonth(activeDate);
  const monthEnd = endOfMonth(activeDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekCount = days.length / 7;

  const { data, loading } = useEvents(gridStart, addDays(gridEnd, 1));
  const allEvents = data?.events ?? [];

  const eventsByDay = useMemo(() => groupByLocalDate(allEvents), [allEvents]);

  const activeEvent = activeId ? (allEvents.find((e) => e.id === activeId) ?? null) : null;

  const handleDayClick = useCallback(
    (day: Date) => {
      goToDate(day);
      navigate(`/day/${format(day, 'yyyy-MM-dd')}`);
    },
    [goToDate, navigate],
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const eventId = active.id as string;
    const targetDateKey = (over.id as string).replace('drop-', '');
    const moved = allEvents.find((e) => e.id === eventId);
    if (!moved) return;

    // No-op if dropped on the same day
    const currentDateKey = format(parseISO(moved.computedStartsAt), 'yyyy-MM-dd');
    if (currentDateKey === targetDateKey) return;

    // Preserve time-of-day, change date
    const originalStart = parseISO(moved.startsAt);
    const targetDate = parseISO(targetDateKey);
    const newStart = new Date(targetDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    updateEventTime(eventId, newStart.toISOString());
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="month-grid" style={{ '--week-count': weekCount } as React.CSSProperties}>
          <div className="month-grid__dow-row" aria-hidden>
            {DOW.map((d, i) => (
              <div
                key={d}
                className={`month-grid__dow${WEEKEND.has(i) ? ' month-grid__dow--weekend' : ''}`}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="month-grid__weeks">
            {Array.from({ length: weekCount }, (_, wi) => (
              <div key={wi} className="month-grid__week">
                {days.slice(wi * 7, wi * 7 + 7).map((day) => {
                  const inMonth = isSameMonth(day, activeDate);
                  const today = isToday(day);
                  const selected = isSameDay(day, activeDate);
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayEvents = (eventsByDay.get(dateKey) ?? []).sort((a, b) =>
                    a.computedStartsAt.localeCompare(b.computedStartsAt),
                  );
                  const overflow = Math.max(0, dayEvents.length - MAX_PILLS);

                  let cls = 'month-grid__day';
                  if (!inMonth) cls += ' month-grid__day--other-month';
                  if (today) cls += ' month-grid__day--today';
                  else if (selected) cls += ' month-grid__day--selected';

                  return (
                    <DroppableDay key={day.toISOString()} dateKey={dateKey} className={cls}>
                      <button
                        className="month-grid__day-num"
                        onClick={() => handleDayClick(day)}
                        aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                        aria-current={today ? 'date' : undefined}
                      >
                        {format(day, 'd')}
                      </button>

                      {loading ? (
                        <Skeleton height={14} borderRadius="4px" />
                      ) : (
                        <>
                          {dayEvents.slice(0, MAX_PILLS).map((ev) => (
                            <EventPill
                              key={ev.id}
                              event={ev}
                              onClick={(e) => setSelectedEvent(e)}
                            />
                          ))}
                          {overflow > 0 && (
                            <span className="month-grid__overflow">+{overflow}</span>
                          )}
                        </>
                      )}
                    </DroppableDay>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeEvent ? <PillGhost event={activeEvent} /> : null}
        </DragOverlay>
      </DndContext>

      {selectedEvent && (
        <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </>
  );
}
