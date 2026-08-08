import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Production: default to a same-origin relative path. netlify.toml proxies
// /graphql to Railway server-side, so the browser only ever talks to this
// site's own origin — the auth cookie then looks first-party instead of
// cross-site, which matters because iOS (Safari and Chrome, same WebKit
// engine) blocks/partitions cross-site cookies via Intelligent Tracking
// Prevention even with correct SameSite=None; Secure attributes.
//
// Dev: fall back to whatever host the page was loaded from, on port 4000,
// rather than a hardcoded 'localhost' — so opening the app via the machine's
// LAN IP (e.g. testing on a phone over WiFi) reaches the right backend
// automatically. This is same-site (same IP, different port) even though
// cross-origin, so it isn't subject to the cross-site cookie restriction above.
//
// VITE_API_URL still wins when explicitly set, for either case.
const defaultApiUrl = import.meta.env.DEV
  ? `${window.location.protocol}//${window.location.hostname}:4000`
  : '';

const httpLink = createHttpLink({
  uri: `${import.meta.env.VITE_API_URL || defaultApiUrl}/graphql`,
  credentials: 'include',
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
