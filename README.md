# schedule-tracker-ui

React frontend for Schedule Tracker — a mobile-first calendar web app.

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

GraphQL TypeScript types are **generated, never hand-maintained**. Run `npm run codegen` after any API schema change. The API must be running when you run codegen (it introspects the live schema).

Generated files land in `src/gql/` which is gitignored. CI runs codegen before the build step so a breaking schema change fails the build rather than surfacing at runtime.

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
