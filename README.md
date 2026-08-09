# schedule-tracker-ui

React frontend for Schedule Tracker — a mobile-first calendar web app. Pairs with the `schedule-tracker-domain` API repo; never a monorepo. Designed to be installed as a standalone app via Safari's "Add to Home Screen" (iOS) / "Add to Dock" (macOS), not just used as a browser tab — see CLAUDE.md's "PWA / installed-app considerations" before changing auth or refresh behavior.

## Features

- Month view (drag-reorder pills, tap empty space to create an event directly, priority-colored pills), Day view (timeline with zoom, same drag-reorder), Year view (tap a month to zoom in)
- Auth: register/verify-email/login/logout/forgot-password/reset-password, all with a show/hide toggle on password fields
- Light/dark/system theming
- Manual refresh button (top nav) — there's no realtime sync, see CLAUDE.md

See CLAUDE.md for the architecture decisions and non-obvious bugs/fixes behind these — several of the above (drag-reorder correctness, theme switching, month-grid layout, iOS login) have real history worth reading before changing them.

## Stack

- React 18 + TypeScript (strict)
- Vite
- Apollo Client 3 (GraphQL)
- graphql-codegen (TypeScript type generation from API schema)

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Create .env from the example
cp .env.example .env

# 3. Start the API (schedule-tracker-domain) first, then generate types
npm run codegen

# 4. Start dev server
npm run dev
```

App: `http://localhost:5173`

## Codegen

GraphQL TypeScript types are **meant to be generated, never hand-maintained** — that's the intent, but in the current codebase every hook hand-writes its own TypeScript types alongside raw `gql` tags, and nothing actually imports the generated output. Running `npm run codegen` still works (it introspects the live API schema, landing files in the gitignored `src/gql/`), but it's not currently wired into anything — there's no CI step consuming it either. See CLAUDE.md before assuming a schema change will be caught automatically; right now it won't be.

## Other commands

```bash
npm run build      # Type-check + Vite production build
npm run typecheck  # Type-check only (no build)
```

## Deployment (Netlify)

Deployed via Netlify's GitHub integration — push to `main` and it redeploys automatically. Build settings come from `netlify.toml` (`npm run build`, publish `dist`).

**Do not set `VITE_API_URL` in Netlify.** Leave it unset. In production, `src/lib/apolloClient.ts` defaults to a same-origin relative path (`/graphql`), and `netlify.toml` proxies that path server-side to the Railway backend. This exists specifically because iOS (Safari and Chrome — same WebKit engine) blocks/partitions cross-site cookies via Intelligent Tracking Prevention even with correct `SameSite=None; Secure` attributes, which broke login on mobile when the frontend called Railway directly. Proxying makes the request same-origin from the browser's point of view, so the auth cookie looks first-party and none of that applies. If you ever need to point at a different backend, set `VITE_API_URL` explicitly and update the proxy target in `netlify.toml` — but understand you're reintroducing the cross-site cookie problem on iOS if the backend is on a different domain than the frontend.

**One-time setup for a new environment:**

1. Create a Netlify site, connect this repo.
2. Under **Environment variables → Project policies → Sensitive variable policy**, pick "Require approval" (the default recommendation — irrelevant for solo pushes to your own branches, only matters for untrusted fork PRs).
3. Update the `to` URL in `netlify.toml`'s `/graphql` redirect to point at your actual Railway backend URL.
4. Deploy, then go set `CORS_ORIGIN` and `APP_URL` on the Railway backend to this site's real `*.netlify.app` (or custom domain) URL.
