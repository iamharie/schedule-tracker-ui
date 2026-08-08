import { gql, useMutation, useApolloClient } from '@apollo/client';
import { addDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { EVENTS_QUERY, type EventData } from './useEvents';

const REORDER_EVENT_MUTATION = gql`
  mutation ReorderEvent($id: ID!, $afterId: ID, $beforeId: ID, $startsAt: DateTime) {
    reorderEvent(id: $id, afterId: $afterId, beforeId: $beforeId, startsAt: $startsAt) {
      id
      sortOrder
      computedStartsAt
    }
  }
`;

export function useReorder() {
  const client = useApolloClient();
  const [mutate, state] = useMutation(REORDER_EVENT_MUTATION);

  // `startsAt` is only needed when the reorder also moves the event to a
  // different day (month-view cross-day drag) — day-view same-day reorders
  // omit it and keep the existing time untouched.
  async function reorderEvent(input: {
    id: string;
    afterId?: string;
    beforeId?: string;
    startsAt?: string;
  }) {
    await mutate({ variables: input });
    await client.refetchQueries({ include: 'active' });
  }

  return { reorderEvent, loading: state.loading };
}

function bySortOrder(a: EventData, b: EventData): number {
  return a.sortOrder < b.sortOrder ? -1 : a.sortOrder > b.sortOrder ? 1 : 0;
}

// "Move to tomorrow" is a reorder, not just a time change — append the event
// to the end of the next day's sequence so it doesn't collide with whatever
// stale sortOrder it already had (the same bug month-view cross-day drag hit).
export function useMoveToTomorrow() {
  const client = useApolloClient();
  const { reorderEvent, loading } = useReorder();

  async function moveToTomorrow(event: EventData) {
    const nextDay = addDays(parseISO(event.startsAt), 1);
    const dayStart = startOfDay(nextDay);
    const dayEnd = endOfDay(nextDay);

    const { data } = await client.query<{ events: EventData[] }>({
      query: EVENTS_QUERY,
      variables: { start: dayStart.toISOString(), end: dayEnd.toISOString() },
      fetchPolicy: 'network-only',
    });

    const siblings = (data?.events ?? []).filter((e) => e.id !== event.id).sort(bySortOrder);
    const afterEv = siblings[siblings.length - 1];

    const newStart = new Date(nextDay);
    if (event.isAnchored) {
      const orig = parseISO(event.startsAt);
      newStart.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
    } else {
      newStart.setHours(9, 0, 0, 0);
    }

    await reorderEvent({ id: event.id, afterId: afterEv?.id, startsAt: newStart.toISOString() });
  }

  return { moveToTomorrow, loading };
}
