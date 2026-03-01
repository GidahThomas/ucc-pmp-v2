# ADR-002: Authentication and Session Strategy

## Status

Accepted

## Context

The original Yii app used session-based auth tied to server-rendered pages. The rebuild uses a decoupled SPA and API deployed on Vercel.

## Decision

Use API-issued JWT bearer tokens for authenticated requests.

- Login remains username/email + password based.
- The API signs tokens with `JWT_SECRET`.
- The browser stores the session payload and bearer token in local storage.
- API routes enforce auth with `authRequired` and role checks with `requireRoles`.

## Consequences

- Preserves login/logout/change-password features
- Removes dependence on sticky sessions or PHP server state
- Introduces a controlled product delta from the original implementation

## Delta from Yii

- Original: Yii session cookies
- Rebuild: JWT bearer token

Reason: the new React + serverless API split needs stateless auth to deploy reliably on Vercel.
