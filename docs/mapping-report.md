# Mapping Report

This report maps the original Yii2 structure into the rebuilt React + Node + Prisma workspace.

## Controller Mapping

| Yii controller | New API | New web |
| --- | --- | --- |
| `controllers/LoginController.php` | `apps/api/src/routes/auth.ts` | `apps/web/src/pages/LoginPage.tsx` |
| `controllers/DashboardController.php` | `apps/api/src/routes/dashboard.ts` | `apps/web/src/pages/DashboardPage.tsx` |
| `controllers/PropertyController.php` | `apps/api/src/routes/properties.ts` | `apps/web/src/pages/PropertyListPage.tsx`, `PropertyFormPage.tsx`, `PropertyDocumentPage.tsx` |
| `controllers/PropertyPriceController.php` | `apps/api/src/routes/property-prices.ts` | `apps/web/src/pages/PropertyPriceListPage.tsx`, `PropertyPriceFormPage.tsx` |
| `controllers/CustomController.php` | `apps/api/src/routes/leases.ts`, `apps/api/src/routes/billing.ts`, `apps/api/src/routes/auth.ts` | `apps/web/src/pages/LeaseListPage.tsx`, `LeaseFormPage.tsx`, `TenantLeasePage.tsx`, `BillsPage.tsx`, `PaymentsPage.tsx`, `ProfilePage.tsx`, `ChangePasswordPage.tsx` |
| `controllers/UsersController.php` | `apps/api/src/routes/users.ts` | `apps/web/src/pages/UsersPage.tsx`, `UserFormPage.tsx` |
| `controllers/ListSourceController.php` | `apps/api/src/routes/list-sources.ts` | `apps/web/src/pages/ListSourcesPage.tsx` |
| `controllers/PropertyAttributeController.php` | `apps/api/src/routes/property-attributes.ts` | `apps/web/src/pages/PropertyAttributesPage.tsx` |
| `controllers/CountryController.php`, `RegionController.php`, `DistrictController.php`, `StreetController.php`, `LocationController.php`, `PropertyLocationController.php` | `apps/api/src/routes/geography.ts` | `apps/web/src/pages/GeographyPage.tsx` |

## Model Mapping

| Yii model | Prisma model | Shared DTO/validator |
| --- | --- | --- |
| `models/Users.php` | `packages/db/prisma/schema.prisma` -> `model User` | `packages/shared/src/users.ts`, `packages/shared/src/auth.ts` |
| `models/ListSource.php` | `model ListSource` | `packages/shared/src/list-sources.ts` |
| `models/Property.php` | `model Property` | `packages/shared/src/properties.ts` |
| `models/PropertyPrice.php` | `model PropertyPrice` | `packages/shared/src/prices.ts` |
| `models/PropertyAttribute.php` | `model PropertyAttribute` | `packages/shared/src/properties.ts` |
| `models/PropertyAttributeAnswer.php` | `model PropertyAttributeAnswer` | API-only nested payloads |
| `models/PropertyExtraData.php` | `model PropertyExtraData` | `packages/shared/src/properties.ts` |
| `models/Lease.php` | `model Lease` | `packages/shared/src/leases.ts` |
| `models/Bill.php` | `model Bill` | `packages/shared/src/bills.ts` |
| `models/Country.php`, `Region.php`, `District.php`, `Street.php`, `Location.php`, `PropertyLocation.php` | `model Country`, `Region`, `District`, `Street`, `Location`, `PropertyLocation` | `packages/shared/src/geography.ts` |

## View Mapping

| Yii view / route | React route |
| --- | --- |
| `views/login/login.php` -> `/login/login` | `/login/login` |
| `views/dashboard/admin-dash.php` -> `/dashboard/admin-dash` | `/dashboard/admin-dash` |
| `views/property/index.php` -> `/property/index` | `/property/index` |
| `views/property/create.php` -> `/property/create` | `/property/create` |
| `views/property/update.php?id=:id` | `/property/update/:id` |
| `views/property/document.php?id=:id` | `/property/document/:id` |
| `views/property-price/index.php` | `/property-price/index` |
| AJAX modal save in `property-price` | `/property-price/save` and `/property-price/save/:id` |
| `views/custom/leases.php` | `/custom/leases` |
| `views/custom/create-lease.php` | `/custom/create-lease` |
| `views/custom/renew.php?id=:id` | `/custom/renew/:id` |
| `views/custom/view-lease.php?tenant=:id` | `/custom/view-lease/:id` |
| `views/custom/bill.php` | `/custom/bill` |
| `views/custom/payment.php` | `/custom/payment` |
| `views/custom/profile.php` | `/custom/profile` |
| `views/custom/change-password.php` | `/custom/change-password` |
| `views/users/index.php` | `/users/index` |
| `views/users/create.php` | `/users/create` |
| `views/users/update.php?id=:id` | `/users/update/:id` |
| `views/list-source/create.php` | `/list-source/create` |
| `views/property-attribute/create.php` | `/property-attribute/create` |
| Geography CRUD indexes | `/country/index`, `/region/index`, `/district/index`, `/street/index`, `/location/index`, `/property-location/index` |

## Config Mapping

| Yii config | New stack |
| --- | --- |
| `config/web.php` | `apps/api/src/config.ts`, `apps/web/src/lib/api.ts`, route definitions in `apps/web/src/App.tsx` |
| `config/db.php` | `.env.example`, `packages/db/prisma/schema.prisma` |
| `config/params.php` | `.env.example` and docs under `docs/` |
| `web/uploads` | `apps/api/uploads` in local mode, Supabase Storage in production mode |
| `web/*` static assets | `apps/web/public/*` |

## Preserved Structure

- Yii controller groups became feature-based API routers under `apps/api/src/routes`.
- Yii models became Prisma models plus Zod validators.
- Yii views became route-matched React pages under `apps/web/src/pages`.
- Shared validation logic moved into `packages/shared` so forms and API agree on payload shapes.

## Intentional Deltas

- ASSUMPTION: Yii query-string edit routes such as `update?id=:id` are better represented as REST path params in the new stack, so the rebuild uses `/update/:id` while preserving the same feature boundaries.
- Session auth was replaced with JWT bearer auth because the new architecture splits browser and API concerns and needs stateless deployment on Vercel.
