# Target Architecture

## Chosen Topology

The rebuild uses a separated SPA + API topology:

- `apps/web`: Vite-built React single-page app
- `apps/api`: Express REST API packaged for Vercel serverless execution
- `packages/shared`: shared types and Zod validation
- `packages/db`: Prisma schema, client bootstrap, migrations, and seed data

This keeps the original Yii module boundaries visible while fitting the requested React + Node + Prisma stack.

## Request Flow

1. Browser loads the React SPA.
2. Login posts to `POST /api/auth/login`.
3. API returns a JWT plus the current user shape.
4. SPA stores the token and uses it for subsequent REST calls.
5. API routes validate input with Zod, authorize by role, and persist through Prisma to Postgres.
6. File uploads use local disk in development or Supabase Storage in production.

## Security Baseline

- Zod validation for body/query payloads
- Centralized error envelope
- JWT auth guard on protected routes
- Role guard for manager/admin mutations
- Service-role key only used on the server side
- No secrets committed; `.env.example` contains placeholders only

## Database Strategy

- Prisma models are derived from Yii ActiveRecord usage and controller behavior.
- The initial migration was generated from the Prisma schema and checked into `packages/db/prisma/migrations`.
- Seed data reproduces the original navigation and workflows with sample users, properties, leases, and bills.

## UI Strategy

- Route names stay close to the original Yii paths.
- Navigation labels mirror the existing portal.
- Styling remains utilitarian with minor spacing/responsiveness improvements only.

## Documented Deltas

- JWT bearer auth replaces Yii session auth.
- React routes use path params where Yii used query strings.
- Production file storage is designed for Supabase Storage instead of PHP local uploads.
