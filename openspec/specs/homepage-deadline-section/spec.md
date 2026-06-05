# homepage-deadline-section Specification

## Purpose

TBD - created by archiving change 'libon-platform-fixes'. Update Purpose after archive.

## Requirements

### Requirement: Homepage displays an "Upcoming Deadlines" section sourced from anismile.jp

The system SHALL render an "即將截單" section on the homepage that shows series with upcoming order deadlines, using live data from the anismile.jp `POST /deadline_list/index` API.

#### Scenario: Rendering the section with live source data

- **WHEN** a user visits the homepage
- **THEN** the "即將截單" section SHALL display series cards fetched from anismile.jp `deadline_list/index`
- **AND** each card SHALL show: series name (translated), series image, deadline date, and product count
- **AND** the section SHALL show at least the first 12 series returned by the API (dayOffset=0)

#### Scenario: Deadline date display

- **WHEN** a series has `deadline_date: "2026年06月04日"` and `earliest_deadline: <unix_timestamp>`
- **THEN** the UI SHALL display the deadline date in a localized format (e.g. "6月4日截單")
- **AND** the series card SHALL link to the corresponding series detail page on Libon (matched by series name)

#### Scenario: Source API unavailable — fallback to local DB

- **WHEN** the anismile.jp `deadline_list/index` API times out or returns a non-200 status
- **THEN** the system SHALL fall back to querying the local database for products with `orderDeadline` within the next 7 days (existing `getDeadlineProducts` behavior)
- **AND** the section SHALL still render with local data without throwing an error to the user

#### Scenario: Missing series image

- **WHEN** a deadline series has no image from the source API
- **THEN** the card SHALL display the placeholder text or a grey placeholder box — it SHALL NOT render a broken image tag

##### Example:

- **GIVEN** `deadline_list/index` returns `{ id: 9999, name: "テスト・6月4日截单", file: { url: "", thumb: "" }, product_count: 5, ... }`
- **WHEN** the DeadlineSection renders this item
- **THEN** the card shows the series name "テスト・6月4日截单" and a placeholder box instead of a broken `<img>` tag
- **AND** no `<img>` element with empty `src` appears in the DOM

<!-- @trace
source: libon-platform-fixes
updated: 2026-06-05
code:
  - packages/api/modules/anismile/procedures/homepage.ts
  - modules/cart/components/CartItem.tsx
  - packages/database/image-utils.ts
  - CLAUDE.md
  - pnpm-workspace.yaml
  - app/api/cron.ts
  - modules/shared/lib/public-prefetch.ts
  - packages/api/modules/anismile/lib/series-sync.ts
  - tsconfig.json
  - public/demo-gap-analysis.html
  - app/api/webhooks/stripe/route.ts
  - packages/database/prisma/schema.prisma
  - modules/catalog/SeriesDetailPage.tsx
  - modules/admin/DashboardPage.tsx
  - .spectra.yaml
  - modules/catalog/components/SeriesCard.tsx
  - tooling/scripts/src/am-catalog-visibility-lib.ts
  - modules/admin/components/EditProductModal.tsx
  - app/(authenticated)/admin/settings/page.tsx
  - modules/admin/AdminCustomersPage.tsx
  - modules/catalog/CategoryPage.tsx
  - modules/detail/components/ImageGallery.tsx
  - packages/database/index.ts
  - packages/database/prisma/migrations/20260605042800_add_anismile_series_table/migration.sql
  - tooling/scripts/src/am-catalog-visibility-probe.ts
  - modules/orders/OrderDetailPage.tsx
  - tooling/scripts/package.json
  - AGENTS.md
  - packages/api/modules/anismile/lib/opencc.ts
  - packages/api/modules/anismile/procedures/settings.ts
  - app/(authenticated)/admin/page.tsx
  - tooling/scripts/src/repair-anismile-pricing-truth.ts
  - package.json
  - packages/database/drizzle/queries/users.ts
  - modules/home/components/InstockSection.tsx
  - modules/catalog/SearchPage.tsx
  - app/(public)/search/page.tsx
  - packages/api/modules/anismile/procedures/orders.ts
  - tooling/scripts/src/create-user.ts
  - modules/member/MemberTierPage.tsx
  - modules/orders/components/OrderCard.tsx
  - app/(public)/series/[id]/page.tsx
  - modules/home/HomePage.tsx
  - modules/admin/AdminProductsPage.tsx
  - packages/api/modules/anismile/procedures/cart.ts
  - tooling/scripts/src/test-db.ts
  - packages/auth/auth.ts
  - GEMINI.md
  - packages/api/modules/anismile/router.ts
  - modules/shared/components/SafeImage.tsx
  - packages/database/prisma/queries/anismile.ts
  - scripts/fix-simplified-chinese.ts
  - modules/catalog/components/TableView.tsx
  - .env.example
  - app/(public)/page.tsx
  - packages/api/package.json
  - modules/catalog/components/ProductCard.tsx
  - modules/catalog/components/FeaturedCarousel.tsx
  - packages/api/modules/anismile/procedures/products.ts
  - packages/api/modules/anismile/procedures/import-order.ts
  - packages/api/modules/anismile/procedures/sync.ts
  - app/(authenticated)/admin/sync/page.tsx
  - packages/api/modules/anismile/lib/r2-image-cache.ts
  - modules/catalog/CatalogPage.tsx
  - packages/api/modules/anismile/lib/crawler.ts
  - packages/database/prisma/queries/index.ts
  - packages/sync/src/crawler.ts
  - app/(authenticated)/layout.tsx
  - modules/home/components/DeadlineSection.tsx
  - packages/api/modules/anismile/procedures/product-pool.ts
  - modules/admin/AdminSettingsPage.tsx
  - app/(public)/products/[id]/page.tsx
  - modules/catalog/components/NewArrivalsScroll.tsx
  - modules/catalog/components/SearchResultTable.tsx
  - modules/catalog/components/PriceDisplay.tsx
  - packages/api/orpc/procedures.ts
  - modules/orders/OrdersPage.tsx
  - packages/database/prisma/zod/index.ts
  - app/(authenticated)/admin/orders/page.tsx
  - app/api/[[...rest]]/route.ts
  - packages/database/prisma/seed-anismile.ts
  - modules/detail/ProductDetailPage.tsx
  - app/(authenticated)/checkout/success/page.tsx
  - packages/database/prisma/index.ts
  - modules/admin/components/OrderTable.tsx
  - packages/database/prisma/queries/backsolve-pricing.ts
  - packages/database/prisma/queries/users.ts
tests:
  - packages/api/modules/anismile/procedures/code-review-remediation.test.ts
  - packages/database/prisma/queries/anismile-search-filters.test.ts
  - modules/home/home-page-performance.test.tsx
  - packages/api/modules/anismile/procedures/product-sync-protection.test.ts
  - packages/api/orpc/procedures.test.ts
  - modules/catalog/series-detail-page.test.ts
  - packages/api/modules/anismile/procedures/homepage-series-visibility.test.ts
  - packages/auth/customer-role-contract.test.ts
  - modules/home/components/deadline-section.test.ts
  - e2e/visual-diff.spec.ts
  - modules/admin/admin-settings-backsolve-percent.test.ts
  - packages/database/prisma/queries/anismile-search-japanese-visibility.test.ts
  - packages/api/modules/anismile/procedures/tier-settings-sync-contract.test.ts
  - modules/catalog/search-page.test.ts
  - packages/api/modules/anismile/procedures/product-source-auth-refresh.test.ts
  - app/api/route-removal.test.ts
  - packages/api/modules/anismile/lib/crawler.test.ts
  - tooling/scripts/src/am-catalog-visibility-lib.test.ts
  - modules/catalog/components/series-card.test.ts
  - packages/database/prisma/queries/anismile-series-migration.test.ts
  - app/api/cron-safety.test.ts
  - modules/catalog/components/table-view.test.ts
  - packages/database/prisma/queries/anismile-series-exact-match.test.ts
  - packages/database/prisma/queries/anismile.backsolve-pricing.test.ts
  - packages/api/modules/anismile/procedures/backsolve-pricing-contract.test.ts
  - modules/admin/admin-products-page.test.ts
  - modules/catalog/search-page-performance.test.tsx
  - modules/catalog/components/product-card.test.ts
  - packages/api/modules/anismile/procedures/homepage.test.ts
  - packages/api/modules/anismile/procedures/public-pricing-visibility.test.ts
  - modules/detail/product-detail-page.test.ts
  - packages/api/modules/anismile/procedures/public-catalog-visibility.test.ts
-->