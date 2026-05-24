# Tasks

- [x] Harden admin tier and product-pool status procedures with middleware authorization.
- [x] Restrict product-pool item status to a known enum.
- [x] Add production guard to visual-test auth bypass.
- [x] Make cron order-summary route fail closed when `CRON_SECRET` is missing.
- [x] Reject invalid CSV import quantities in client and server paths.
- [x] Reject unavailable or expired products in import-order confirmation.
- [x] Block checkout submission when cart contains unavailable products.
- [x] Make admin order status selects controlled.
- [x] Defer admin order export query until export is requested.
- [x] Sync admin default markup input from server state.
- [x] Keep role-management query and UI super-admin only.
- [x] Clarify daily-summary Email notification wording.
- [x] Run `pnpm type-check`.
- [x] Run `pnpm test`.
- [x] Validate SR with `spectra validate anismile-code-review-remediation --strict`.
- [ ] Follow-up: split `AdminProductsPage` God component.
- [ ] Follow-up: consolidate duplicated CSV/image/status helpers.
- [ ] Follow-up: replace static source tests with behavior tests for checkout/import/admin flows.
