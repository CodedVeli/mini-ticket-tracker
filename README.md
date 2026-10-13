# Mini Ticket Tracker

A small support-ticket tracker: an Express + PostgreSQL REST API and a single-page Next.js UI.

## Stack

- **API:** Node.js 22, Express 5, TypeScript, `pg` (raw SQL), zod
- **Database:** PostgreSQL 16 (Docker)
- **UI:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Tests:** Vitest + Supertest against a real Postgres test database

## Prerequisites

- Node.js 22+
- Docker (for Postgres)

## Setup & run

```bash
# 1. Start Postgres (creates the `tickets` and `tickets_test` databases)
docker compose up -d --wait

# 2. API — http://localhost:4000
cd server
npm install
npm run migrate
npm run dev

# 3. UI — http://localhost:3000 (in a second terminal)
cd web
npm install
npm run dev
```

Open http://localhost:3000.

Postgres is exposed on host port **5435** to avoid clashing with a local Postgres on 5432. All settings have working defaults; override them with environment variables if needed:

| Variable | Used by | Default |
|---|---|---|
| `DATABASE_URL` | API | `postgres://postgres:postgres@localhost:5435/tickets` |
| `TEST_DATABASE_URL` | tests | `postgres://postgres:postgres@localhost:5435/tickets_test` |
| `PORT` | API | `4000` |
| `API_URL` | UI (rewrite target) | `http://localhost:4000` |

## Tests

```bash
cd server
npm test
```

Tests run against `tickets_test` (never the dev database). Migrations are applied automatically before the suite and the table is truncated before each test. They cover create (defaults, validation), list (status filter, pagination, ordering), stats (including zero counts), and update (success, empty body, unknown and malformed ids).

## API

All errors return `{ "error": { "message": string, "details"?: [...] } }`.

| Method & path | Description |
|---|---|
| `POST /tickets` | Create a ticket. Body: `title` (required, 1–200 chars), `description?`, `priority?` (`low`/`medium`/`high`, default `medium`), `status?` (`open`/`in_progress`/`closed`, default `open`). Returns `201`. |
| `GET /tickets?status=&page=&limit=` | List tickets, newest first. `page` default 1, `limit` default 10 (max 100). Returns `{ data, page, limit, total }`. |
| `PATCH /tickets/:id` | Update `status` and/or `priority` (at least one; other fields rejected). `400` for a malformed id, `404` if not found. |
| `GET /tickets/stats` | Counts per status, e.g. `{ "open": 2, "in_progress": 0, "closed": 1 }`. |
| `GET /health` | Liveness check. |

## Project layout

```
docker-compose.yml        Postgres 16
db/init.sql               creates the test database
server/
  migrations/             plain SQL migrations, tracked in schema_migrations
  src/app.ts              Express app (no listen, so tests can import it)
  src/tickets/routes.ts   HTTP layer: validate → repo → respond
  src/tickets/repo.ts     all SQL
  src/tickets/validation.ts  zod schemas
  tests/                  API integration tests
web/
  app/page.tsx            renders the single client component
  components/             TicketTracker, StatsBar, NewTicketForm, TicketList
  lib/api.ts              typed fetch client
  next.config.ts          rewrites /api/* to the Express API
```

## Decisions & Tradeoffs

I used raw parameterized SQL with `pg` and a tiny migration runner rather than an ORM: with one table and four queries, the SQL is short, explicit, and easy to review. Status and priority are native Postgres enums, and validation happens twice (zod for friendly `400`s, database constraints as a backstop), though adding an enum value later needs an explicit migration. IDs are UUIDs, so they don't leak ticket counts and can't be enumerated, at the cost of natural ordering, so lists sort by `created_at` with `id` as a tiebreaker. Pagination uses `LIMIT/OFFSET` with a `COUNT(*)`, which is simple and gives page numbers; at larger scale I'd switch to keyset (cursor) pagination. Next.js is used purely as a client-side UI. There are no API routes or server actions, so the Express API stays the single backend, and a Next rewrite proxies `/api/*` to avoid CORS. After a create or status change, the UI simply refetches the list and stats. With more time I'd add React Query for caching and optimistic updates, plus UI component tests. Tests hit a real Postgres database instead of mocks, so the SQL itself is tested. Out of scope: authentication, structured logging, rate limiting, ticket deletion and editing title/description, and a production Docker setup for the API and UI. Assumptions: `status` may be set on create (default `open`), titles are trimmed and limited to 200 characters, and `PATCH` only accepts `status` and `priority`, as the brief specifies.
