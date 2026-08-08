import { parseISO } from 'date-fns';
import type { EventData } from '../hooks/useEvents';

export const HOUR_PX = 60; // 1px per minute, 60px per hour
export const MIN_EVENT_HEIGHT = 30;

export type LayoutEvent = EventData & {
  startMin: number; // minutes from midnight (local)
  endMin: number;
  col: number;
  totalCols: number;
};

/**
 * Assign non-overlapping columns to timed events.
 * Two events overlap when their [startMin, endMin) intervals intersect.
 * Returns events sorted by startMin with col/totalCols set.
 */
export function layoutTimedEvents(events: EventData[]): LayoutEvent[] {
  const timed = events
    .filter((e) => !e.allDay)
    .map((e) => {
      const d = parseISO(e.computedStartsAt);
      const startMin = d.getHours() * 60 + d.getMinutes();
      const endMin = startMin + Math.max(e.durationMinutes, MIN_EVENT_HEIGHT);
      return { ...e, startMin, endMin, col: 0, totalCols: 1 };
    })
    .sort((a, b) => a.startMin - b.startMin);

  // Greedy column assignment: find leftmost column whose last event ended
  const colEnds: number[] = []; // colEnds[c] = endMin of the last event placed in column c

  const assigned = timed.map((e) => {
    let col = colEnds.findIndex((end) => end <= e.startMin);
    if (col === -1) col = colEnds.length;
    colEnds[col] = e.endMin;
    return { ...e, col };
  });

  // Second pass: for each event, totalCols = max column used by any overlapping event + 1
  return assigned.map((e) => {
    const maxCol = assigned
      .filter((o) => o.startMin < e.endMin && o.endMin > e.startMin)
      .reduce((m, o) => Math.max(m, o.col), 0);
    return { ...e, totalCols: maxCol + 1 };
  });
}

/** Group events by local-date string "yyyy-MM-dd" using computedStartsAt. */
export function groupByLocalDate(events: EventData[]): Map<string, EventData[]> {
  const map = new Map<string, EventData[]>();
  for (const e of events) {
    const d = parseISO(e.computedStartsAt);
    // Local date key: YYYY-MM-DD
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return map;
}

/** Priority display config */
export const PRIORITY_META = {
  HIGH: { label: 'High', varBg: '--clr-priority-high-bg', varClr: '--clr-priority-high' },
  MEDIUM: { label: 'Medium', varBg: '--clr-priority-medium-bg', varClr: '--clr-priority-medium' },
  NICE_TO_DO: { label: 'Nice to do', varBg: '--clr-priority-nice-bg', varClr: '--clr-priority-nice' },
} as const;
