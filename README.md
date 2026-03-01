# UCC PMP Rebuild

React + Node.js + Prisma rebuild of the original Yii2 property management portal in `e:\Ucc_pmp`.

## Workspace

- `apps/web`: React SPA that preserves the original route structure and navigation labels.
- `apps/api`: Express REST API grouped by the original Yii controller/module boundaries.
- `packages/shared`: shared Zod validators and DTO types.
- `packages/db`: Prisma schema, generated client wrapper, migrations, and seed data.
- `docs`: architecture, mapping, deployment, and migration notes.

## Prerequisites

- Node.js 20+
- `corepack` enabled for `pnpm`
- Docker Desktop or another Docker runtime for local Postgres

## Run Locally

1. Copy `.env.example` to `.env`.
2. Start Postgres: `docker compose up -d db`
3. Install dependencies: `pnpm install`
4. Generate Prisma client: `pnpm db:generate`
5. Apply the initial migration: `pnpm db:migrate:dev`
6. Seed example data: `pnpm db:seed`
7. Start frontend + API together: `pnpm dev`

Frontend: `http://localhost:5173`
API: `http://localhost:4000`

## Use Supabase (Cloud)

1. Put your Supabase Postgres connection strings into repo root `.env.local` (recommended) or `.env`:
   - `DATABASE_URL` (pooled/runtime)
   - `DIRECT_URL` (direct/migrations)
2. Apply migrations + seed: `pnpm supabase:setup`

## Seeded Logins

- Admin: `admin@ucc-pmp.local` / `Admin@123`
- Manager: `manager@ucc-pmp.local` / `Manager@123`
- Tenant: `tenant@ucc-pmp.local` / `Tenant@123`

## Quality Gates

- Type/lint checks: `pnpm lint`
- Build: `pnpm build`
- Smoke tests: `pnpm test`

## Deployment

See `docs/deploy-vercel.md`.

## Notes

- ASSUMPTION: the original `bill.bill_status` is better treated as a lookup foreign key than a free-text enum because the Yii views/controllers consistently resolve it from `list_source`.
- ASSUMPTION: the original `property_extra_data` table requires `property_attribute_id` even though the Yii ActiveRecord metadata is incomplete.
