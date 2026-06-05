## Problem

Full-repo code review found security, data-integrity, and admin-UX defects that should be remediated separately from the production smoke-test SR.

## Root Cause

Several admin-only operations use local role checks instead of shared admin middleware, some user inputs are under-validated, and several admin pages fire expensive or privileged queries before the user needs them.

## Proposed Solution

- Harden admin APIs with shared middleware and stricter input schemas.
- Fail closed for visual-test auth bypass and cron secret handling.
- Reject invalid CSV import quantities and unavailable imported products.
- Keep admin order status controls synchronized and defer full export queries until requested.
- Record larger architecture and test-quality findings as follow-up tasks in this SR.

## Non-Goals

- Do not re-enable credit card payments.
- Do not redesign the admin UI.
- Do not complete large refactors such as splitting `AdminProductsPage` in the first remediation commit.

## Success Criteria

- Non-admin users cannot update tiers or product-pool item status.
- Product-pool item status accepts only known workflow statuses.
- Production auth cannot be bypassed by `ANISMILE_VISUAL_TEST_BYPASS_AUTH`.
- CSV import rejects zero, negative, and non-finite quantities.
- Admin orders page no longer fetches export CSV on initial render.
- Local type-check and test suite pass.

## Impact

- Affected code:
  - Modified:
    - app/(authenticated)/layout.tsx
    - app/api/cron/order-summary/route.ts
    - modules/admin/AdminOrdersPage.tsx
    - modules/admin/AdminSettingsPage.tsx
    - modules/admin/components/OrderTable.tsx
    - modules/checkout/CheckoutPage.tsx
    - modules/import-order/ImportOrderPage.tsx
    - packages/api/modules/anismile/procedures/import-order.ts
    - packages/api/modules/anismile/procedures/member-tier.ts
    - packages/api/modules/anismile/procedures/product-pool.ts
