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

API URL comes from `VITE_API_URL` env var — never hardcoded. Apollo Client sends `credentials: 'include'` on every request so httpOnly session cookies are transmitted cross-origin.

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
