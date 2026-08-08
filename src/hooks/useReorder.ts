import { gql, useMutation, useApolloClient } from '@apollo/client';

const REORDER_EVENT_MUTATION = gql`
  mutation ReorderEvent($id: ID!, $afterId: ID, $beforeId: ID) {
    reorderEvent(id: $id, afterId: $afterId, beforeId: $beforeId) {
      id
      sortOrder
      computedStartsAt
    }
  }
`;

export function useReorder() {
  const client = useApolloClient();
  const [mutate, state] = useMutation(REORDER_EVENT_MUTATION);

  async function reorderEvent(input: { id: string; afterId?: string; beforeId?: string }) {
    await mutate({ variables: input });
    await client.refetchQueries({ include: 'active' });
  }

  return { reorderEvent, loading: state.loading };
}
