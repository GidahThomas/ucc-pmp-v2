# System Inventory

This inventory is the Phase 1 forensic summary used to drive the rebuild in `ucc_pmp_rebuild/`.

## Feature List

- Authentication: login, logout, password change, profile display
- Dashboard: portfolio counts, lease summary, property analytics
- Properties: list, filter, create, update, detail/document page
- Property prices: list, create, update, delete
- Leases: list, create, renew, terminate, tenant-specific history, delete
- Billing and payments: bill list, bill delete, payment list
- Users: list, filter, create, update, delete
- Configuration: `list_source` hierarchy, property attribute definitions
- Geography: countries, regions, districts, streets, locations, property-location links

## Primary Pages

- `/login/login`
- `/dashboard/admin-dash`
- `/property/index`
- `/property/create`
- `/property/update?id=:id`
- `/property/document?id=:id`
- `/property-price/index`
- `/custom/leases`
- `/custom/create-lease`
- `/custom/renew?id=:id`
- `/custom/view-lease?tenant=:tenantId`
- `/custom/bill`
- `/custom/payment`
- `/custom/profile`
- `/custom/change-password`
- `/users/index`
- `/users/create`
- `/users/update?id=:id`
- `/list-source/create`
- `/property-attribute/create`
- `/country/index`
- `/region/index`
- `/district/index`
- `/street/index`
- `/location/index`
- `/property-location/index`

## Data Operations

- Login by `users.full_name` or email
- CRUD for users, list sources, property attributes, geography tables
- CRUD for properties with uploaded document/image
- CRUD for property prices
- Lease creation with overlap prevention and bill creation
- Lease renewal and termination
- Bill listing and deletion
- Payment listing from paid bills

## Entities and Key Relations

- `users`
- `country` -> `region`
- `region` -> `district`, `street`, `ward`, `location`
- `district` -> `street`, `ward`, `location`
- `street` -> `property`, `location`
- `location` -> `property_location`
- `list_source` -> self-referential lookup hierarchy
- `property` -> `property_price`, `property_extra_data`, `lease`
- `property_attribute` -> `property_attribute_answer`
- `lease` -> `bill`

## Auth and Access Control

- Yii session auth via `app\models\Users`
- RBAC roles: `tenant`, `manager`, `admin`
- Permissions seeded via Yii RBAC: `create`, `edit`, `delete`, `assign`, `view`, `manage`

ASSUMPTION: the permissive guest rule in `CustomController` is accidental and the intended behavior is authenticated access only.

## Missing or Conflicting Source Details

- No Yii migrations or SQL dump were found.
- `PropertyExtraData` code references `property_attribute_id`, but the model metadata is incomplete.
- `bill.bill_status` is treated both as free text and as a lookup foreign key.
- User profile references such as `profile_picture` and `username` appear inconsistent across models and views.

ASSUMPTION: `users.user_id` is the canonical user primary key and the legacy `models/User.php` should not drive the rebuild.

For the full forensic write-up used during implementation, see the original report at `e:\Ucc_pmp\docs\system-inventory.md`.
