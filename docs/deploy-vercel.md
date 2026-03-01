# Deploy to Vercel

Deploy the frontend and API as two Vercel projects from the same repository.

## API Project

- Root Directory: `ucc_pmp_rebuild/apps/api`
- Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- Build Command: `cd ../.. && pnpm --filter @ucc/shared build && pnpm --filter @ucc/db prisma:generate && pnpm --filter @ucc/db build && pnpm --filter @ucc/api build`
- Output Directory: leave empty
- Config file: `apps/api/vercel.json`

## Web Project

- Root Directory: `ucc_pmp_rebuild/apps/web`
- Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- Build Command: `cd ../.. && pnpm --filter @ucc/shared build && pnpm --filter @ucc/web build`
- Output Directory: `dist`
- Config file: `apps/web/vercel.json`

## Environment Variables

| Variable | Web | API | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | optional | required | `production` on Vercel |
| `CORS_ORIGIN` | no | required | Web origin for API CORS |
| `DATABASE_URL` | no | required | Supabase pooled Postgres connection string |
| `DIRECT_URL` | no | required | Supabase direct connection string for Prisma migrations |
| `JWT_SECRET` | no | required | Long random secret, server side only |
| `STORAGE_MODE` | no | required | `supabase` in production if uploads should persist |
| `UPLOAD_BASE_URL` | no | required | Public API origin used for local-storage URLs |
| `SUPABASE_URL` | no | required when `STORAGE_MODE=supabase` | Server-side storage access |
| `SUPABASE_SERVICE_ROLE_KEY` | no | required when `STORAGE_MODE=supabase` | Never expose to the browser |
| `SUPABASE_STORAGE_BUCKET` | no | optional | Defaults to `ucc-pmp-files` |
| `SUPABASE_ANON_KEY` | optional | no | Not used by the current implementation because the browser does not call Supabase directly |
| `VITE_API_BASE_URL` | required | no | Public API base URL, for example `https://api.example.vercel.app/api` |

## Recommended Production Settings

- Use Supabase Postgres for `DATABASE_URL` and `DIRECT_URL`.
- Set `STORAGE_MODE=supabase` so uploads are not lost on serverless instances.
- Keep the API and web on separate Vercel domains or custom subdomains.
- Set `CORS_ORIGIN` to the final web origin exactly.

## Deploy Order

1. Create the Supabase project and database.
2. Set all API environment variables in Vercel.
3. Run the initial Prisma migration against Supabase from a trusted environment.
4. Seed data if needed for demonstration or QA.
5. Deploy the API project.
6. Set `VITE_API_BASE_URL` in the web project to the API deployment URL.
7. Deploy the web project.
