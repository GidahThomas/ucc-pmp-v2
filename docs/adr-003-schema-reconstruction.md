# ADR-003: Schema Reconstruction from Incomplete Yii Sources

## Status

Accepted

## Context

The original repository did not include database migrations or a schema dump. Several ActiveRecord definitions are incomplete or contradictory.

## Decision

Derive the Prisma schema from:

- ActiveRecord attributes and relations
- Yii controller create/update/list queries
- View usage patterns
- Route-level business rules

## Normalizations

- ASSUMPTION: `bill.bill_status` is a foreign key to `list_source`.
- ASSUMPTION: `property_extra_data.property_attribute_id` exists and is required.
- ASSUMPTION: `lease_number` is optional because the original UI falls back to UUID-like identifiers.
- ASSUMPTION: legacy profile fields such as `profile_picture` are non-core and excluded from the initial schema.

## Consequences

- Prisma schema is explicit and relationally sound
- Missing Yii schema details are recorded instead of silently invented
- Future correction is straightforward if an authoritative SQL dump appears
