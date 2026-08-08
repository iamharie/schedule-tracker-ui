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
