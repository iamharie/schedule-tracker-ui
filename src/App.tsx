import { gql, useQuery } from '@apollo/client';

const HEALTH_QUERY = gql`
  query Health {
    health
  }
`;

export default function App() {
  const { data, loading, error } = useQuery<{ health: string }>(HEALTH_QUERY);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Schedule Tracker</h1>
      {loading && <p>Connecting to API...</p>}
      {error && <p style={{ color: 'red' }}>API error: {error.message}</p>}
      {data && (
        <p style={{ color: 'green' }}>
          API status: {data.health}
        </p>
      )}
    </div>
  );
}
