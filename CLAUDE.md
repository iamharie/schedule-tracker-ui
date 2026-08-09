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

GraphQL types are **meant to be generated, never hand-maintained** — that's the intended design, but it's currently aspirational: every hook (`useEvents.ts`, `useMutations.ts`, `useReorder.ts`, etc.) uses raw `gql` template tags with manually hand-written TypeScript types, not the generated client. `src/gql/` (gitignored) is never actually imported anywhere. If you run codegen, it works (introspects the live API), but nothing consumes the output yet. Worth knowing before assuming type drift between the schema and frontend types is caught automatically — it currently isn't.

```bash
# Requires the API to be running
npm run codegen
```

## API connection

`src/lib/apolloClient.ts` resolves the GraphQL URI in this order: explicit `VITE_API_URL` env var if set → in dev, the page's own host on port 4000 (so opening the app via a LAN IP for phone testing reaches the right backend without editing env vars per-IP) → in production, a same-origin relative `/graphql` path, proxied to Railway by `netlify.toml`. Apollo Client sends `credentials: 'include'` on every request so httpOnly session cookies are transmitted.

The production default is same-origin **on purpose**, not just a convenience: iOS (Safari and Chrome — same WebKit engine) blocks/partitions cross-site cookies via Intelligent Tracking Prevention even with correct `SameSite=None; Secure` attributes. Calling Railway directly from the Netlify-hosted page broke login on iOS specifically (worked on desktop Chrome) until this proxy was added. See the README's Deployment section before changing this.

## Mobile-first rules

- Design and test at 375px viewport first
- All primary actions reachable one-handed in the bottom half of the screen
- Minimum 44×44px touch targets — with one deliberate, accepted exception: Year view's individual date cells are ~24×24px (see Year view below)
- No hover-only interactions anywhere
- Respect `safe-area-inset-*` for notches and home indicators
- Utility actions that are occasional, not primary (menu drawer, year-view shortcut, refresh) live in the top nav's corners, not the bottom nav — the bottom nav is reserved for Month/Day navigation + the create FAB

## Theming

All colors as CSS custom properties in one place (`tokens.css`). Light/dark/system options. Priority colors have separate values per theme. No hard-coded hex in components.

**Bug fixed, contract to preserve:** `CalendarContext`'s theme effect (and the matching pre-hydration inline script in `index.html`) must always call `setAttribute('data-theme', dark ? 'dark' : 'light')` — never just conditionally set it and otherwise leave the attribute absent. `tokens.css`'s system-dark media query opts out only on the literal `data-theme="light"` value; leaving the attribute unset for an explicit Light choice let the OS dark preference silently override it on any device with system dark mode on. If theme selection ever seems to stop working again, check this contract first.

**Event color = priority, not calendar.** Pills, day-view blocks, the drag-overlay ghost, and the detail-drawer identity dot all derive their color from `event.priority` via `PRIORITY_META` in `lib/layout.ts` (High=red, Medium=amber, Nice to do=green) — not from the event's calendar. Calendar color is still used, just only for identifying calendars themselves in the calendar-list drawer/sidebar, not for coloring individual events.

## Gesture priority

Vertical drag (distance/delay-gated via dnd-kit `MouseSensor`/`TouchSensor`) reorders pills — the one gesture that's actually built, and the most fragile to regress (spec explicitly treats a sluggish/fiddly drag as project failure regardless of what else works). **Swipe-to-delete/complete and pinch-to-zoom-via-gesture were never implemented** — deliberately deferred, since building them safely means detecting swipe-vs-drag intent on the exact same pill elements that already carry the reorder gesture, and that deserves a dedicated pass with real on-device testing, not a rushed addition alongside other work. Zoom exists, but only via explicit −/+ buttons in Day view (`useZoom.ts`), not pinch.

If you do build swipe actions later: priority order should still be drag > swipe action > navigation swipe, and test extensively on a real phone — this exact class of interaction has already caused real, hard-to-reproduce-in-automation bugs twice this project (a floating FAB that clipped on real Safari, a bottom-sheet button that overlapped the nav bar) despite looking fine in headless browser testing both times.

## Drag & reorder model

Both Day view and Month view mutate the same backend field (`sortOrder`, a fractional index) via `useReorder.ts` — see the domain repo's CLAUDE.md "Event scheduling model" for why `sortOrder` drives displayed time (`computedStartsAt`), not the reverse. Practical implications for this repo:

- **Day view**: dragging a *flexible* event reorders it (`reorderEvent` with `afterId`/`beforeId` computed from time-position, no `startsAt`). Dragging an *anchored* event instead calls `useUpdateEventTime` — that's a deliberate UX distinction (anchored = reschedule to an absolute time; flexible = reorder position), not an oversight.
- **Month view**: every pill is both draggable and a drop target (`EventPill.tsx`, `PILL_DROP_PREFIX`). Dropping on a pill inserts before it; dropping on empty cell space appends to the end of that day. Pills sort by raw `sortOrder`, not `computedStartsAt` — intentional, so the display always exactly reflects what you just dragged, with no indirection through the cascade computation.
- **Cross-day drags** (month view only) pass `startsAt` to `reorderEvent` so the day-move and the reposition land in one atomic mutation — see domain CLAUDE.md for why two separate mutations caused a visible "undo" flicker.
- Recurring occurrence pills (`isOccurrence: true`, synthetic id `${realId}:${isoDate}`) are drag-disabled and drop-disabled — they aren't real rows, so they can't anchor a reorder. Also can't be edited or reliably deleted/completed (dormant gap, not currently reachable since there's no recurrence-creation UI — see domain repo's Known limitations).

## Month view layout

Rows and columns are deliberately **not** simple `1fr` grid tracks — both had real bugs from that:
- `grid-template-rows: repeat(N, minmax(min-content, 1fr))` on `.month-grid__weeks` — a bare `1fr` track's automatic minimum is its content's height, which either forced every row to an equal fixed height regardless of content (early bug) or let a busy week stretch unpredictably (the fix's actual intent: quiet weeks fill their fair 1fr share so a quiet month fills the whole screen with no dead space; a busy week is allowed to grow past that share, up to `MAX_PILLS` (currently 6) pills before falling back to a "+N" badge, and the page scrolls if the grid grows past the viewport).
- `grid-template-columns: repeat(7, minmax(0, 1fr))` on `.month-grid__week` — hard-caps every day column to an equal 1/7 share no matter what. This exists because a single unbroken word in an event title (no spaces to wrap at) will grow a bare-`1fr` column to fit it, breaking column alignment and causing horizontal scroll. Combined with `overflow-wrap: break-word` on `.event-pill__title` (which needs `min-width: 0` to actually take effect — flex items don't shrink below content width by default) and `-webkit-line-clamp: 2` for the 2-line-then-ellipsis title treatment.
- Tapping a day cell's empty space (not the day number, not a pill) selects that day (`goToDate`) without navigating — lets the bottom `+` FAB create an event there directly. The day-number button still navigates to Day view, with `stopPropagation` so the two don't double-fire.

## Year view

`/year` route, `YearView.tsx`. Deliberately **month-level navigation only** — tapping anywhere on a mini-month card (not just its label) goes to Month view for that month; day cells are plain non-interactive `<span>`s, not buttons, by explicit request (no day-level jump from Year view — that's Month view's job). 3×4 grid on mobile (all 12 months on one screen), widens to 4 columns on desktop. `TopNav` becomes year-aware by route (`useLocation`) — prev/next arrows and the title switch to year semantics when on `/year`.

## PWA / installed-app considerations

`index.html` has `apple-mobile-web-app-capable` meta tags — this is used as a standalone app via Safari's "Add to Home Screen" (iOS) and "Add to Dock" (macOS), not just a browser tab. Two things that follow from that:
- **No realtime sync exists**, and in standalone mode there's no browser chrome to pull-to-refresh from — `TopNav`'s refresh button (`window.location.reload()`, a genuine hard reload, not a query refetch) is the only way to force freshness. Deliberately placed as a top-nav utility action, not in the bottom nav, and visible on both mobile and desktop (unlike the year-view shortcut, which desktop hides in favor of the sidebar).
- **Cross-site cookie behavior differs from a normal browser tab** in ways that don't always show up in desktop testing — see "API connection" above re: the `/graphql` proxy and iOS's Intelligent Tracking Prevention. If a mobile-only auth bug ever appears again, check this class of issue before assuming it's a backend problem.

## Shared components worth knowing about

- `components/ui/PasswordField.tsx` — password input with a show/hide eye-icon toggle, used by every password field across Login/Register/Reset (5 fields, 3 pages). Add new password inputs through this component, not a raw `<input type="password">`, to keep the toggle consistent everywhere.
- `lib/layout.ts`'s `PRIORITY_META` — the single source of truth for priority label/color mapping. Anything rendering a priority badge or event color should read from here, not redeclare the High/Medium/Nice-to-do color logic locally.

## Running

```bash
npm run dev        # Vite dev server on :5173
npm run build      # tsc + vite build
npm run codegen    # generate types from running API
npm run typecheck  # type-check only
```
