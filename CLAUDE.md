# schedule-tracker-ui — Architecture Notes

## Stack decisions

| Layer | Choice | Reason |
|-------|--------|--------|
| Build tool | Vite | Fastest dev server; first-class React + TS |
| GraphQL client | Apollo Client 3 | Strong ecosystem; best DevTools; integrates with codegen |
| Type generation | graphql-codegen client-preset | Generates hooks + types from running API schema |
| DnD (Phase 6) | dnd-kit | Excellent touch + keyboard + accessibility support |
| Date formatting | date-fns + date-fns-tz | Tree-shakeable; TypeScript-native; IANA timezone support |

## Type generation

GraphQL types are **generated, never hand-maintained**. Source of truth is the API schema.

```bash
# Requires the API to be running
npm run codegen
```

Generated files land in `src/gql/` (gitignored). CI must run codegen before building so a schema breaking change fails the build instead of surfacing at runtime.

## API connection

`src/lib/apolloClient.ts` resolves the GraphQL URI in this order: explicit `VITE_API_URL` env var if set → in dev, the page's own host on port 4000 (so opening the app via a LAN IP for phone testing reaches the right backend without editing env vars per-IP) → in production, a same-origin relative `/graphql` path, proxied to Railway by `netlify.toml`. Apollo Client sends `credentials: 'include'` on every request so httpOnly session cookies are transmitted.

The production default is same-origin **on purpose**, not just a convenience: iOS (Safari and Chrome — same WebKit engine) blocks/partitions cross-site cookies via Intelligent Tracking Prevention even with correct `SameSite=None; Secure` attributes. Calling Railway directly from the Netlify-hosted page broke login on iOS specifically (worked on desktop Chrome) until this proxy was added. See the README's Deployment section before changing this.

## Mobile-first rules

- Design and test at 375px viewport first
- All primary actions reachable one-handed in the bottom half of the screen
- Minimum 44×44px touch targets
- No hover-only interactions anywhere
- Respect `safe-area-inset-*` for notches and home indicators

## Theming (Phase 4)

All colors as CSS custom properties in one place. Light/dark/system options. Priority colors have separate values per theme. No hard-coded hex in components.

## Gesture priority (Phase 5+)

Horizontal swipe → day/week/month navigation  
Vertical drag (120ms press) → pill reorder  
Short swipe on pill → left=delete, right=complete  
Pinch → zoom level  

These must not conflict. Priority order: drag > swipe action > navigation swipe.

## Running

```bash
npm run dev        # Vite dev server on :5173
npm run build      # tsc + vite build
npm run codegen    # generate types from running API
npm run typecheck  # type-check only
```
