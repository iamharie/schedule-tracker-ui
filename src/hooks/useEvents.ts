import { gql, useQuery } from '@apollo/client';
import { useCalendarContext } from '../context/CalendarContext';

export const EVENTS_QUERY = gql`
  query Events($start: DateTime!, $end: DateTime!, $calendarIds: [ID!]) {
    events(start: $start, end: $end, calendarIds: $calendarIds) {
      id
      calendarId
      title
      notes
      location
      startsAt
      computedStartsAt
      durationMinutes
      allDay
      priority
      isAnchored
      sortOrder
      rrule
      completedAt
      isOccurrence
      originalEventId
      occurrenceDate
    }
  }
`;

export type Priority = 'HIGH' | 'MEDIUM' | 'NICE_TO_DO';

export type EventData = {
  id: string;
  calendarId: string;
  title: string;
  notes: string | null;
  location: string | null;
  startsAt: string;
  computedStartsAt: string;
  durationMinutes: number;
  allDay: boolean;
  priority: Priority;
  isAnchored: boolean;
  sortOrder: string;
  rrule: string | null;
  completedAt: string | null;
  isOccurrence: boolean;
  originalEventId: string | null;
  occurrenceDate: string | null;
};

type EventsData = { events: EventData[] };

export function useEvents(start: Date, end: Date) {
  const { selectedIds, calendars } = useCalendarContext();

  // Pass explicit calendarIds only when the user has deselected some
  const calendarIds =
    selectedIds.size < calendars.length ? Array.from(selectedIds) : undefined;

  return useQuery<EventsData>(EVENTS_QUERY, {
    variables: { start: start.toISOString(), end: end.toISOString(), calendarIds },
    errorPolicy: 'ignore',
    skip: calendars.length > 0 && selectedIds.size === 0,
    // Month/day views mount fresh on every navigation with the same variables
    // as a prior visit; cache-first would silently serve stale data from
    // before a mutation made elsewhere (e.g. create an event in Day view, then
    // navigate to Month view without it ever having been an "active" query
    // during that mutation's refetch). cache-and-network still paints
    // instantly from cache, then reconciles from the network.
    fetchPolicy: 'cache-and-network',
  });
}
