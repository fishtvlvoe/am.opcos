## Decisions

### D1: Admin authorization belongs in procedure middleware

Admin-only procedures should use `anismileAdminProcedure` or `anismileSuperAdminProcedure` instead of ad hoc handler checks. Handler checks may remain only for narrower business rules, such as blocking ordinary admins from assigning VIP.

### D2: Input schemas reject invalid state before DB writes

`adminBatchUpdateItemStatus` will accept only the known item workflow statuses used by the product-pool UI. CSV import quantity validation must exist both in the client parser and server input schema.

### D3: Test-only auth bypass must fail closed in production

`ANISMILE_VISUAL_TEST_BYPASS_AUTH=1` is valid only outside production. In production, unauthenticated users are always redirected to `/login`.

### D4: Admin pages should not issue privileged or expensive queries by default

Role-management data should load only when the current session is `super_admin`. Order export CSV should be fetched on explicit user action, not on initial page render.

## Deferred Follow-Ups

- Split `AdminProductsPage` into smaller components.
- Consolidate duplicated CSV download, image URL, and order status helpers.
- Replace static source assertions with behavior tests in high-risk modules.
- Optimize product-list session subscription and related-product images.
