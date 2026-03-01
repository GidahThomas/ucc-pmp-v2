# ADR-001: Vercel Deployment Topology

## Status

Accepted

## Context

The rebuild must keep frontend and backend concerns separated, avoid PHP, and deploy cleanly on Vercel.

## Decision

Use:

- Vite React SPA in `apps/web`
- Express API in `apps/api`
- Vercel deployment as two projects, one for the SPA and one for the API

## Consequences

- Clear separation between browser UI and REST API
- Minimal change to the original module boundaries
- Stateless API deployment compatible with JWT auth
- Separate environment variables for browser and server concerns
- Requires one Vercel project for `apps/web` and one for `apps/api`
