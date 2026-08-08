import { gql, useMutation, useApolloClient } from '@apollo/client';
import type { Priority } from './useEvents';

const UPDATE_EVENT_MUTATION = gql`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      startsAt
      computedStartsAt
      isAnchored
      sortOrder
    }
  }
`;

const QUICK_CREATE_MUTATION = gql`
  mutation QuickCreateEvent($input: QuickCreateEventInput!) {
    quickCreateEvent(input: $input) {
      id
      title
      computedStartsAt
      durationMinutes
      priority
      calendarId
      isOccurrence
      originalEventId
      occurrenceDate
    }
  }
`;

const DELETE_EVENT_MUTATION = gql`
  mutation DeleteEvent($id: ID!, $scope: RecurrenceScope) {
    deleteEvent(id: $id, scope: $scope)
  }
`;

const TOGGLE_COMPLETE_MUTATION = gql`
  mutation ToggleEventComplete($id: ID!) {
    toggleEventComplete(id: $id) {
      id
      completedAt
    }
  }
`;

export function useQuickCreate() {
  const client = useApolloClient();
  const [mutate, state] = useMutation(QUICK_CREATE_MUTATION);

  async function quickCreate(input: {
    title: string;
    date: string;
    calendarId?: string;
    startsAt?: string;
    durationMinutes?: number;
    priority?: Priority;
    isAnchored?: boolean;
  }) {
    await mutate({ variables: { input } });
    await client.refetchQueries({ include: 'active' });
  }

  return { quickCreate, loading: state.loading, error: state.error };
}

export function useDeleteEvent() {
  const client = useApolloClient();
  const [mutate, state] = useMutation(DELETE_EVENT_MUTATION);

  async function deleteEvent(id: string, scope = 'ALL_EVENTS') {
    await mutate({ variables: { id, scope } });
    await client.refetchQueries({ include: 'active' });
  }

  return { deleteEvent, loading: state.loading };
}

export function useUpdateEventTime() {
  const client = useApolloClient();
  const [mutate] = useMutation(UPDATE_EVENT_MUTATION);

  async function updateEventTime(id: string, startsAt: string) {
    await mutate({ variables: { id, input: { startsAt } } });
    await client.refetchQueries({ include: 'active' });
  }

  return { updateEventTime };
}

export function useToggleComplete() {
  const client = useApolloClient();
  const [mutate] = useMutation(TOGGLE_COMPLETE_MUTATION);

  async function toggleComplete(id: string) {
    await mutate({ variables: { id } });
    await client.refetchQueries({ include: 'active' });
  }

  return { toggleComplete };
}
