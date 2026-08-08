import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Falls back to whatever host the page was loaded from (same port-4000
// convention) rather than a hardcoded 'localhost' — so opening the app via
// the machine's LAN IP (e.g. for testing on a phone) reaches the right
// backend automatically, without editing VITE_API_URL every time the IP
// changes. VITE_API_URL still wins when explicitly set (e.g. in production).
const defaultApiUrl = `${window.location.protocol}//${window.location.hostname}:4000`;

const httpLink = createHttpLink({
  uri: `${import.meta.env.VITE_API_URL || defaultApiUrl}/graphql`,
  credentials: 'include',
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
