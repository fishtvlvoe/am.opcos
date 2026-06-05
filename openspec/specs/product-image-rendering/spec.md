# product-image-rendering Specification

## Purpose

TBD - created by archiving change 'libon-platform-fixes'. Update Purpose after archive.

## Requirements

### Requirement: Series cards use optimized image loading

The system SHALL render series card images using Next.js `<Image>` component with lazy loading and responsive sizing.

#### Scenario: Homepage series grid

- **WHEN** the homepage series grid renders
- **THEN** each series card image SHALL use `next/image` `<Image>` component
- **AND** it SHALL specify `fill` with `sizes` attribute for responsive breakpoints
- **AND** it SHALL use `object-cover` for consistent aspect ratio
- **AND** images outside the viewport SHALL be lazy-loaded

#### Scenario: Missing image fallback

- **WHEN** a series has no available image URL
- **THEN** the card SHALL display a placeholder text "系列圖片" instead of a broken image


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

---
### Requirement: Product detail images use optimized loading

The system SHALL render product detail page images using Next.js `<Image>` component.

#### Scenario: Related products section

- **WHEN** the product detail page displays related products
- **THEN** each related product image SHALL use `next/image` `<Image>` component
- **AND** it SHALL specify appropriate `width` and `height` or `fill` with `sizes`


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

---
### Requirement: Admin product images use optimized loading

The system SHALL render admin product list images using Next.js `<Image>` component.

#### Scenario: Admin product table

- **WHEN** the admin products page renders the product table
- **THEN** each product thumbnail SHALL use `next/image` `<Image>` component
- **AND** it SHALL specify `width={40}` and `height={40}` for consistent sizing

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