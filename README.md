# Rotto Recruiter

Rotto Recruiter is a recruiter workspace for finding candidates from a natural-language brief. The frontend sends a brief to an authenticated API; the backend asks a configured Gemini-compatible LLM to extract supported criteria, filters candidate records in PostgreSQL, ranks matches, and stores a search run so its results can be paged.

**Application overview:** [Watch the quick Loom walkthrough](https://www.loom.com/share/065f4d8e6fcc4e53ac69c5a04e3986ad).

## Contents

- [What is implemented](#what-is-implemented)
- [Architecture](#architecture)
- [Repository map](#repository-map)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Run the application](#run-the-application)
- [Features and API](#features-and-api)
- [Database](#database)
- [Environment variables](#environment-variables)
- [Checks and development](#checks-and-development)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)

## What is implemented

- Recruiter login through Supabase Auth, with an authenticated workspace and server-side, HTTP-only token cookies in the Next.js app.
- Dashboard navigation to Candidate Search and Saved Searches.
- Natural-language candidate search with backend-extracted filters, candidate summaries and details, and page-number pagination (20 candidates per page).
- A company-level free/paid plan field and a one-search free-plan quota. The current API returns HTTP `402` after a free company has exhausted its quota.
- Seed scripts for local recruiter/company accounts and candidate profiles.

Saved Searches is currently an explanatory placeholder. The backend stores search runs to support result pagination, but has no API to list, rename, delete, or reopen saved searches. Shortlists are also a dashboard placeholder. Do not treat either as implemented persistence features.

## Architecture

```mermaid
flowchart LR
  Browser[Browser / Next.js] -->|login and authenticated proxy| API[Express API]
  Browser -->|HTTP-only cookies| Next[Next.js route handlers]
  Next -->|Bearer access token| API
  API -->|verify user| Auth[Supabase Auth]
  API -->|Drizzle queries| DB[(Supabase local PostgreSQL)]
  API -->|interpret brief| LLM[Gemini-compatible LLM API]
```

The frontend is in `frontend/` and the API is in `backend/`; each has an independent `package.json` and `package-lock.json`. The backend uses Drizzle ORM with the `pg` driver. Supabase provides local PostgreSQL and Auth services. Search interpretation requires an external Gemini-compatible API and credentials; no LLM is bundled with the repository.

## Repository map

```text
.
├── README.md
├── .env.be.example                 # Backend local environment template
├── .env.fe.example                 # Frontend local environment template
├── backend/
│   ├── data/candidates.json        # Candidate import source (do not edit generated records casually)
│   ├── src/
│   │   ├── app.ts, server.ts       # Express setup, health endpoints, startup
│   │   ├── config/                 # Environment and LLM configuration
│   │   ├── db/schema/              # Drizzle table definitions
│   │   ├── db/seed/                # Recruiter and candidate seed scripts
│   │   ├── lib/                    # Supabase Auth and LLM clients
│   │   ├── middleware/             # Authentication and API error handling
│   │   ├── modules/auth/           # Login and current-recruiter endpoints
│   │   ├── modules/search/         # Search interpretation, persistence, query/ranking
│   │   ├── routes/                 # API route composition
│   │   ├── utils/                  # Success/error response helpers
│   │   └── validators/             # Request and filter schemas
│   ├── supabase/
│   │   ├── config.toml             # Local Supabase ports and services
│   │   ├── migrations/             # Ordered SQL migrations
│   │   └── seed.sql                # Supabase CLI seed file (currently empty)
│   ├── drizzle.config.ts           # Drizzle Kit configuration
│   └── package.json                # Backend scripts and dependencies
└── frontend/
    ├── src/app/                    # Next.js App Router pages and API route handlers
    ├── src/components/             # Shared layout and UI components
    ├── src/features/auth/          # Login UI, schema, and service
    ├── src/features/candidate-search/ # Search workspace, filters, results, API schema/service
    ├── src/lib/                    # Toast and server-side API proxy utilities
    ├── public/                     # Static assets
    └── package.json                # Frontend scripts and dependencies
```

Important routes are `/login`, `/dashboard`, `/candidate-search`, and `/saved-searches`. Authenticated pages are grouped under `frontend/src/app/(authenticated)/`; route handlers under `frontend/src/app/api/` proxy requests to the backend and attach the session token. The frontend also has a `frontend/README.md` generated from the framework starter; this root document is the project setup guide.

## Requirements

- Node.js **20.9 or newer** (Next.js declares `>=20.9.0`; no exact Node version is pinned by this repository).
- npm, using the checked-in lockfiles (lockfile version 3). The repository does not declare an npm version.
- Docker Desktop or another Docker-compatible engine for the local Supabase stack, plus the Supabase CLI. The CLI is a backend dev dependency and can be invoked with `npx supabase` from `backend/`.
- A Gemini-compatible LLM API endpoint, API key, and model name for natural-language search.
- On Windows, use Git Bash or WSL for the provided npm scripts: `frontend` dev and `backend` build include the POSIX `rm -rf` command.

Supabase local configuration uses PostgreSQL major version **17**, with database port `54322`, Supabase API/Auth port `54321`, Studio port `54323`, and SMTP web UI port `54324` (see `backend/supabase/config.toml`).

## Local setup

Run commands in the indicated directory. There is no root package manifest, combined setup command, Docker Compose file, or root-level test runner.

1. Clone the repository and enter it:

   ```bash
   git clone <repository-url>
   cd rotto-recruiter-app
   ```

2. Create local environment files. Copy the root templates into the application folders:

   ```bash
   cp .env.be.example backend/.env
   cp .env.fe.example frontend/.env.local
   ```

   On Windows, use `Copy-Item .env.be.example backend/.env` and `Copy-Item .env.fe.example frontend/.env.local` in PowerShell. Fill in the backend placeholders as described in [Environment variables](#environment-variables). Never commit local environment files or real keys.

3. Install backend and frontend dependencies separately:

   ```bash
   cd backend && npm ci
   cd ../frontend && npm ci
   cd ..
   ```

4. Start local Supabase from `backend/`:

   ```bash
   cd backend
   npx supabase start
   npx supabase status
   ```

   Copy the local `anon` and `service_role` keys printed by `supabase status` into `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`. Keep the service-role key private. The local service URL is `http://127.0.0.1:54321`; the PostgreSQL URL from the template is `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.

5. Apply the SQL migrations, then seed the backend. From `backend/`:

   ```bash
   npx supabase db reset
   # Full seed: companies/recruiters followed by candidate data
   npm run db:seed
   ```

   `supabase db reset` recreates the local database and applies all files under `supabase/migrations/`. **It is destructive:** it deletes the local database contents before rebuilding them. The configured `supabase/seed.sql` is empty, so `npm run db:seed` imports the application seed data. It runs the auth/company seed first, then the candidate seed. The candidate seed truncates existing candidate, experience, and education rows before importing; it does not remove recruiter accounts or company records.

   To run only one seed, use the individual scripts from `backend/`:

   ```bash
   npm run db:seed:auth       # Companies and Supabase Auth recruiter accounts
   npm run db:seed:candidates # Candidate profiles, experiences, and education
   ```

   Run `db:seed:auth` before `db:seed:candidates` when setting up from scratch; candidate data requires the migrated database, while auth seeding requires the local Supabase Auth service and backend environment keys. Use the full `npm run db:seed` for a complete local seed.

6. Configure `LLM_API_URL`, `LLM_API_KEY`, and `LLM_MODEL` in `backend/.env`. The URL template supports `{{}}` as the model insertion point; the backend replaces it with `LLM_MODEL`. All three are needed to run search, though the backend will start without them. The server must be able to reach the LLM provider.

7. Ensure `API_PREFIX` in `backend/.env` and `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` agree. The templates use `/api/v1`; the Express configuration default is also `/api/v1`.

The seed script provides local login accounts:

| Email | Password | Company |
| --- | --- | --- |
| `recruiter@acme.test` | `rotto-assessment` | Acme |
| `recruiter@globex.test` | `rotto-assessment` | Globex |

These are development-only credentials. Do not use them outside a local environment.

## Run the application

Keep the local Supabase services running. In separate terminals:

```bash
# Terminal 1 — backend
cd backend
npm run dev
```

```bash
# Terminal 2 — frontend
cd frontend
npm run dev
```

The frontend is served at [http://localhost:3000](http://localhost:3000); the API listens at [http://localhost:4000](http://localhost:4000). Visit `/login`, sign in with a seed account, then open Dashboard or Candidate Search. Supabase Studio is at [http://127.0.0.1:54323](http://127.0.0.1:54323).

Confirm startup with `GET http://localhost:4000/health` (API process) and `GET http://localhost:4000/health/db` (database connection). Both return JSON with a `success` field. The backend also checks PostgreSQL before it starts listening.

For production-mode local checks, build each package and start it from its own directory:

```bash
cd backend
npm run build
npm start
```

```bash
cd frontend
npm run build
npm start
```

Set `NODE_ENV=production` and provide production credentials before deployment. The frontend production server uses port `3000` by default; the backend uses `PORT` (default `4000`).

## Features and API

### User workflow

1. Sign in at `/login`. The Next.js login route forwards credentials to the backend; access and refresh tokens are stored in HTTP-only cookies.
2. Open Candidate Search and enter a natural-language brief (1–2,000 characters).
3. The backend sends the brief to the configured LLM, validates the extracted filters against its supported schema, and searches/ranks matching candidate records. Results are persisted in `search_runs` and the company quota is updated on successful free searches.
4. Review the extracted filter criteria and candidate summaries. Load more candidates via the page-number endpoint, if another page exists.

### Backend endpoints

The API prefix defaults to `/api/v1` and can be changed with `API_PREFIX`. Success responses use `{ "success": true, "message": string, "data": ... }`; errors use `{ "success": false, "message": string, "code": string, "details"?: [...] }`.

| Method and path | Auth | Purpose |
| --- | --- | --- |
| `GET /health` | No | API liveness check |
| `GET /health/db` | No | PostgreSQL connectivity check |
| `POST /api/v1/auth/login` | No | Sign in with `{ "email", "password" }`; returns Supabase session tokens and recruiter/company data |
| `GET /api/v1/auth/me` | Bearer token | Return the authenticated recruiter and company |
| `POST /api/v1/search` | Bearer token | Submit `{ "brief": string }`; return `search_id`, extracted `filters`, first-page `items`, pagination metadata, and remaining free searches |
| `GET /api/v1/search/{search_id}?page=1` | Bearer token | Retrieve a stored search page; page size is fixed at 20 and response candidates are under `results` |

Candidate search accepts only the brief in the request. Supported extracted criteria are skills, roles, seniority (`junior`, `mid`, `senior`, `staff`, `lead`, `principal`), minimum/maximum years of experience, company type (`startup`, `enterprise`), location city/state/country, and open-to-work status. Criteria are interpreted by the LLM, then validated; unsupported filters are not query parameters. Matching is performed against seeded candidate fields and experience records, with skill/role, experience, and update-time ranking. No API for editing filters is exposed.

Example search request (replace the token with a valid Supabase access token):

```bash
curl -X POST http://localhost:4000/api/v1/search \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <access-token>' \
  -d '{"brief":"Find senior backend engineers with 5+ years of Python and PostgreSQL experience in New York."}'
```

Search results include up to 20 candidate objects ordered by the backend, and pagination metadata with `page`, `pageSize`, `total`, `totalPages`, `hasNextPage`, and `hasPreviousPage`. The initial response currently includes `items`; the page retrieval response currently uses `results`. A free company has one successful search; further submissions return `402` with code `FREE_SEARCH_LIMIT_REACHED`. Paid companies have `searches_remaining: null`. LLM connection/configuration failures and invalid LLM output return actionable API errors.

The frontend also exposes same-origin handlers at `POST /api/search` and `GET /api/search/{searchId}?page=N`; these forward the request and session cookie to the backend. Login is handled at `POST /api/auth/login` and logout at `POST /api/auth/logout`.

### Incomplete capabilities

- Saved Searches currently explains the missing backend capability. `search_runs` records a brief, extracted criteria, candidate IDs, company, and creation time for pagination, but there is no list/get-saved-search API or dedicated persisted saved-search workflow.
- Candidate result responses contain summary-profile fields; full experience and education are seeded in separate tables but are not currently returned by the search endpoints.
- Shortlists, billing/plan management, and production deployment automation are not implemented in the application repository. `STRIPE_WEBHOOK_SECRET` is accepted by configuration but no Stripe route is currently mounted.

## Database

Supabase local development runs PostgreSQL 17. Drizzle schema definitions live in `backend/src/db/schema/`; tracked Supabase SQL migrations are in `backend/supabase/migrations/`. The main tables are:

| Table | Purpose |
| --- | --- |
| `companies` | Recruiter company, plan (`free`/`paid`), and search usage counter |
| `recruiters` | App recruiter linked to a Supabase Auth user and company |
| `candidates` | Candidate summary, skills, experience years, location, and work status |
| `candidate_experiences` | Candidate role/company history and company type |
| `candidate_education` | Candidate school, degree, field, and graduation year |
| `search_runs` | Company-scoped brief, extracted filters, ordered result IDs, and timestamp |

Use `npx supabase db reset` from `backend/` to recreate the local DB and replay migrations (destructive; see setup warning). For a complete seed, run `npm run db:seed`; to seed separately, use `npm run db:seed:auth` and `npm run db:seed:candidates` (auth first on a fresh setup). Drizzle Kit commands are `npm run db:generate` and `npm run db:migrate`; they operate on Drizzle Kit's configured `backend/drizzle/` output and are separate from the repository's Supabase migration workflow. For this project’s checked-in schema migrations, use Supabase CLI commands.

Useful diagnostics from `backend/`:

```bash
npx supabase status
npm run db:generate
```

Then use `/health/db` to verify that the API can connect to PostgreSQL. Do not run reset against a shared or production database.

## Environment variables

Copy the safe root templates to `backend/.env` and `frontend/.env.local`. The backend loads `backend/.env` from its working directory; the Next.js app reads `frontend/.env.local`. Never expose `SUPABASE_SERVICE_ROLE_KEY`, LLM credentials, or auth secrets in client-side code or commit local env files.

| Variable | Required? | Used for |
| --- | --- | --- |
| `NODE_ENV` | Optional; defaults to `development` | Backend environment; frontend uses `production` to set secure cookies |
| `PORT` | Optional; defaults to `4000` | Backend HTTP port |
| `API_PREFIX` | Optional; defaults to `/api/v1` | Express API route prefix; keep aligned with the frontend base URL |
| `DATABASE_URL` | Required | PostgreSQL connection used by Drizzle |
| `JWT_SECRET` | Required by backend config validation | Must be at least 32 characters; the app's login tokens are issued and verified by Supabase Auth |
| `LLM_API_URL` | Optional to start API, required for search | Gemini-compatible generate-content URL; `{{}}` is replaced with model name |
| `LLM_API_KEY` | Optional to start API, required for search | Provider API credential |
| `LLM_MODEL` | Optional to start API, required for search | Model inserted into URL template and sent in LLM request URL |
| `STRIPE_WEBHOOK_SECRET` | Optional; currently unused by mounted routes | Reserved configuration; no Stripe webhook route is implemented |
| `SUPABASE_URL` | Required | Local/hosted Supabase API URL for auth clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Required | Backend-only Supabase admin client (user lookup and seed Auth accounts) |
| `SUPABASE_ANON_KEY` | Required | Supabase Auth password login client |
| `NEXT_PUBLIC_API_BASE_URL` | Required by frontend requests | Backend base URL including API prefix, e.g. `http://localhost:4000/api/v1` |

`backend/.env` must use a `JWT_SECRET` of 32 or more characters even though application authentication uses Supabase access tokens. Generate a random local value, for example with Node.js: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Do not reuse local secrets in production.

## Checks and development

Commands are run from their package directory:

| App | Command | Purpose |
| --- | --- | --- |
| Backend | `npm run typecheck` | TypeScript validation |
| Backend | `npm run build` | Compile TypeScript into `backend/dist/` |
| Backend | `npm run db:generate` | Generate Drizzle migration artifacts from schema |
| Backend | `npm run db:migrate` | Apply Drizzle Kit migrations to `DATABASE_URL` |
| Backend | `npm run db:seed:auth` | Seed two companies and recruiter Auth users |
| Backend | `npm run db:seed:candidates` | Replace candidate profiles and related records from JSON |
| Backend | `npm run db:seed` | Run both seed operations |
| Frontend | `npm run lint` | ESLint |
| Frontend | `npx tsc --noEmit` | TypeScript validation (no package script is defined) |
| Frontend | `npm run build` | Production Next.js build |

The backend's `npm test` script is a placeholder that exits with “no test specified”; `search.validators.test.ts` is not wired to an automated test runner. No frontend test script or end-to-end test setup is configured. Do not interpret these as passing tests.

Keep changes scoped to the feature. Follow the existing feature-based frontend structure and Express module/validator/schema conventions. For database changes, update the Drizzle schema and add an ordered SQL migration under `backend/supabase/migrations/`; then validate against a fresh local database.

## Troubleshooting

- **Backend exits with invalid environment configuration:** check all required backend variables in `backend/.env`, especially the database URL, 32-character `JWT_SECRET`, Supabase URL and keys.
- **Database connection fails / API does not start:** start Supabase with `npx supabase start` from `backend/`, check `npx supabase status`, verify `DATABASE_URL`, then call `/health/db`.
- **Tables are missing:** from `backend/`, run `npx supabase db reset` against the local instance. This deletes local DB data before replaying migrations.
- **No candidates or recruiters are available:** run `npm run db:seed` from `backend/`; this imports recruiter accounts and candidate data. Candidate seeding replaces candidate rows.
- **Search fails but API starts:** verify the three LLM variables and provider connectivity. Search interpretation returns `503` on provider failure and `502` for invalid model output.
- **401/403 on search:** log in again; only seeded/reconciled recruiter records linked to a Supabase Auth user are allowed. API requests use `Authorization: Bearer <access-token>`; browser requests go through Next route handlers and cookies.
- **Frontend reports service not configured:** verify `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local`, including the same `/api/v1` prefix as backend `API_PREFIX`, and restart Next.js after changing env files.
- **Port conflicts:** update `PORT` for Express or the Supabase ports in `backend/supabase/config.toml`; keep API base URL and database URL consistent with the changed ports.
- **`rm` is not recognized on Windows:** run the package scripts in Git Bash or WSL, as noted in requirements.

## Deployment

The repository contains no hosting-provider configuration, Dockerfile, Compose file, CI deployment workflow, or production migration orchestration. A deployment therefore requires selecting infrastructure and configuring it separately.

Generic production outline:

1. Build frontend and backend with `npm ci` and their respective `npm run build` commands.
2. Provide production `DATABASE_URL`, Supabase URL/keys, `JWT_SECRET`, LLM settings, and `NEXT_PUBLIC_API_BASE_URL` via the hosting platform's secret/configuration manager. Do not ship service-role keys to the browser.
3. Provision PostgreSQL/Supabase Auth and apply checked-in SQL migrations in order using an approved migration process. Do not use `supabase db reset` against production; it is a local reset workflow.
4. Start the backend with `npm start` and the frontend with `npm start` in their respective package directories. Configure the frontend's public API URL to reach the backend and configure CORS for the real frontend origin; the current backend CORS allow-list is hard-coded to `http://localhost:3000` and must be adapted before a non-local cross-origin deployment.
5. Monitor application logs and use `/health` and `/health/db` for API and database health. Verify production authentication, LLM access, and quota behavior before release.
