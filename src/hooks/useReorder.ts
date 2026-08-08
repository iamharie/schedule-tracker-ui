import { gql, useMutation, useApolloClient } from '@apollo/client';

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
