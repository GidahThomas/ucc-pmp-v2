# Migration Notes

## Goal

Translate the existing Yii2 property management portal into React + Node + Prisma without redesigning the product.

## Preserved

- Feature set and module boundaries
- Core navigation labels
- Route grouping by business area
- Data model shape and lookup-driven configuration style
- Auth roles: `admin`, `manager`, `tenant`

## Required Deltas

- Session auth changed to JWT bearer auth
- Query-string edit routes changed to path-param routes in the SPA
- MySQL configuration changed to Postgres/Supabase
- PHP upload handling changed to local Node uploads in development and optional Supabase Storage in production

## Implementation Notes

- Shared validators live in `packages/shared`.
- Prisma models live in `packages/db/prisma/schema.prisma`.
- Initial SQL migration lives in `packages/db/prisma/migrations/0001_initial/migration.sql`.
- Seed data reproduces the main flows and provides logins for QA.

## Assumptions Carried into the Rebuild

- ASSUMPTION: `bill_status` should remain lookup-driven via `list_source`.
- ASSUMPTION: incomplete/legacy user profile fields are non-blocking and can be added later if authoritative schema evidence appears.
- ASSUMPTION: static seed assets can be represented by placeholder SVG/text assets because the original repository did not contain a complete reusable media set.
