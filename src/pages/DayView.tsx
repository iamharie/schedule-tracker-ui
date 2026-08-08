import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, parseISO, isToday, isValid, startOfDay, endOfDay } from 'date-fns';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensors,
  useSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useCalendarContext } from '../context/CalendarContext';
import { useEvents, type EventData } from '../hooks/useEvents';
import { useReorder } from '../hooks/useReorder';
import { layoutTimedEvents, HOUR_PX } from '../lib/layout';
import { EventBlock, EventGhost } from '../components/event/EventBlock';
import { EventDetail } from '../components/event/EventDetail';
import type { LayoutEvent } from '../lib/layout';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export default function DayView() {
  const { date } = useParams<{ date: string }>();
  const { goToDate, calendars } = useCalendarContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { reorderEvent } = useReorder();

  const parsedDate = date ? parseISO(date) : new Date();
  const validDate = isValid(parsedDate) ? parsedDate : new Date();

  useEffect(() => {
    goToDate(validDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_PX;
    }
  }, [date]);

  const rangeStart = startOfDay(validDate);
  const rangeEnd = endOfDay(validDate);

  const { data, loading } = useEvents(rangeStart, rangeEnd);
  const events = data?.events ?? [];

  const allDayEvents = events.filter((e) => e.allDay);
  const timedEvents = layoutTimedEvents(events);

  const showNow = isToday(validDate);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const heading = isToday(validDate)
    ? `Today · ${format(validDate, 'MMMM d')}`
    : format(validDate, 'EEEE, MMMM d, yyyy');

  // Active drag event + its calendar color
  const activeEvent = activeId ? timedEvents.find((e) => e.id === activeId) ?? null : null;
  const activeColor =
    activeEvent
      ? (calendars.find((c) => c.id === activeEvent.calendarId)?.color ?? 'var(--clr-primary)')
      : 'var(--clr-primary)';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, delta }: DragEndEvent) {
    setActiveId(null);
    if (!delta.y) return;

    const dragged = timedEvents.find((e) => e.id === active.id);
    if (!dragged || dragged.isAnchored) return;

    const rawMin = dragged.startMin + delta.y;
    const snappedMin = Math.max(0, Math.min(1439, Math.round(rawMin / 15) * 15));

    // Use only real (non-occurrence) events as sort neighbors
    const sortable = timedEvents
      .filter((e) => e.id !== dragged.id && !e.isOccurrence)
      .sort((a, b) => a.startMin - b.startMin);

    const afterEv = [...sortable].reverse().find((e) => e.startMin <= snappedMin);
    const beforeEv = sortable.find((e) => e.startMin > snappedMin);

    reorderEvent({
      id: dragged.id,
      afterId: afterEv?.id,
      beforeId: beforeEv?.id,
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="day-view-root">
        {allDayEvents.length > 0 && (
          <div className="allday-strip">
            <div className="allday-strip__label">All day</div>
            <div className="allday-strip__events">
              {allDayEvents.map((e) => (
                <button
                  key={e.id}
                  className="allday-event"
                  onClick={() => setSelectedEvent(e)}
                >
                  {e.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="timeline-scroll" ref={scrollRef}>
          <div className="day-heading">
            <h2 className="day-heading__text">{heading}</h2>
          </div>

          <div
            className="timeline"
            style={{ height: 24 * HOUR_PX }}
            aria-label="Day timeline"
          >
            {HOURS.map((h) => (
              <div
                key={h}
                className="timeline__hour"
                style={{ top: h * HOUR_PX }}
                aria-hidden
              >
                <span className="timeline__hour-label">{formatHour(h)}</span>
                <span className="timeline__hour-line" />
              </div>
            ))}

            {showNow && (
              <div
                className="timeline__now"
                style={{ top: nowMin }}
                aria-label="Current time"
              />
            )}

            <div className="timeline__events">
              {loading
                ? null
                : timedEvents.map((e) => (
                    <EventBlock
                      key={e.id}
                      event={e}
                      onClick={(ev: LayoutEvent) => setSelectedEvent(ev)}
                    />
                  ))}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeEvent ? <EventGhost event={activeEvent} color={activeColor} /> : null}
      </DragOverlay>

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </DndContext>
  );
}
