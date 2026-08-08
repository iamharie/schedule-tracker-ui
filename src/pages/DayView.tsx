import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, parseISO, isToday, isValid, startOfDay, endOfDay } from 'date-fns';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensors,
  useSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useCalendarContext } from '../context/CalendarContext';
import { useEvents, type EventData } from '../hooks/useEvents';
import { useReorder } from '../hooks/useReorder';
import { useUpdateEventTime } from '../hooks/useMutations';
import { useZoom } from '../hooks/useZoom';
import { layoutTimedEvents } from '../lib/layout';
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

function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function DayView() {
  const { date } = useParams<{ date: string }>();
  const { goToDate } = useCalendarContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { reorderEvent } = useReorder();
  const { updateEventTime } = useUpdateEventTime();
  const { hourPx, stepDown, stepUp, atMin, atMax } = useZoom();

  const parsedDate = date ? parseISO(date) : new Date();
  const validDate = isValid(parsedDate) ? parsedDate : new Date();

  useEffect(() => {
    goToDate(validDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // Scroll to current time when viewing today, 7 AM for other days
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isToday(validDate)) {
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      el.scrollTop = Math.max(0, nowMin * (hourPx / 60) - el.clientHeight / 3);
    } else {
      el.scrollTop = 7 * hourPx;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // Maintain visible center time when zoom changes
  const prevHourPxRef = useRef(hourPx);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || prevHourPxRef.current === hourPx) {
      prevHourPxRef.current = hourPx;
      return;
    }
    const centerMin = (el.scrollTop + el.clientHeight / 2) / (prevHourPxRef.current / 60);
    el.scrollTop = Math.max(0, centerMin * (hourPx / 60) - el.clientHeight / 2);
    prevHourPxRef.current = hourPx;
  }, [hourPx]);

  const rangeStart = startOfDay(validDate);
  const rangeEnd = endOfDay(validDate);

  const { data, loading } = useEvents(rangeStart, rangeEnd);
  const events = data?.events ?? [];

  const allDayEvents = events.filter((e) => e.allDay);
  const timedEvents = layoutTimedEvents(events);

  const showNow = isToday(validDate);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const minutePx = hourPx / 60;

  const heading = isToday(validDate)
    ? `Today · ${format(validDate, 'MMMM d')}`
    : format(validDate, 'EEEE, MMMM d, yyyy');

  const totalMinutes = events
    .filter((e) => !e.allDay)
    .reduce((sum, e) => sum + e.durationMinutes, 0);
  const totalsLabel =
    events.length > 0
      ? `${events.length} event${events.length === 1 ? '' : 's'} · ${formatDuration(totalMinutes)} scheduled`
      : null;
  const isEmpty = !loading && events.length === 0;

  const activeEvent = activeId ? (timedEvents.find((e) => e.id === activeId) ?? null) : null;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, delta }: DragEndEvent) {
    setActiveId(null);
    if (!delta.y) return;

    const dragged = timedEvents.find((e) => e.id === active.id);
    if (!dragged || dragged.isOccurrence) return;

    const rawMin = dragged.startMin + delta.y / minutePx;
    const snappedMin = Math.max(0, Math.min(1439, Math.round(rawMin / 15) * 15));

    if (dragged.isAnchored) {
      // Anchored event: move to an absolute time slot on this day
      const newStart = new Date(validDate);
      newStart.setHours(0, snappedMin, 0, 0);
      updateEventTime(dragged.id, newStart.toISOString());
    } else {
      // Flexible event: reorder relative to siblings
      const sortable = timedEvents
        .filter((e) => e.id !== dragged.id && !e.isOccurrence)
        .sort((a, b) => a.startMin - b.startMin);

      const afterEv = [...sortable].reverse().find((e) => e.startMin <= snappedMin);
      const beforeEv = sortable.find((e) => e.startMin > snappedMin);

      reorderEvent({ id: dragged.id, afterId: afterEv?.id, beforeId: beforeEv?.id });
    }
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
            <div className="day-heading__col">
              <h2 className="day-heading__text">{heading}</h2>
              {totalsLabel && <p className="day-heading__totals">{totalsLabel}</p>}
            </div>
            <div className="zoom-controls" aria-label="Zoom timeline">
              <button
                className="zoom-btn"
                onClick={stepDown ?? undefined}
                disabled={atMin}
                aria-label="Zoom out"
                title="Zoom out"
              >
                −
              </button>
              <button
                className="zoom-btn"
                onClick={stepUp ?? undefined}
                disabled={atMax}
                aria-label="Zoom in"
                title="Zoom in"
              >
                +
              </button>
            </div>
          </div>

          <div
            className="timeline"
            style={{ height: 24 * hourPx }}
            aria-label="Day timeline"
          >
            {HOURS.map((h) => (
              <div
                key={h}
                className="timeline__hour"
                style={{ top: h * hourPx }}
                aria-hidden
              >
                <span className="timeline__hour-label">{formatHour(h)}</span>
                <span className="timeline__hour-line" />
              </div>
            ))}

            {showNow && (
              <div
                className="timeline__now"
                style={{ top: nowMin * minutePx }}
                aria-label="Current time"
              />
            )}

            {isEmpty && (
              <div className="day-empty-state" style={{ top: 7 * hourPx }}>
                <p className="day-empty-state__title">Nothing scheduled</p>
                <p className="day-empty-state__hint">Tap + below to add an event</p>
              </div>
            )}

            <div className="timeline__events">
              {loading
                ? null
                : timedEvents.map((e) => (
                    <EventBlock
                      key={e.id}
                      event={e}
                      hourPx={hourPx}
                      onClick={(ev: LayoutEvent) => setSelectedEvent(ev)}
                    />
                  ))}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeEvent ? (
          <EventGhost event={activeEvent} hourPx={hourPx} />
        ) : null}
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
