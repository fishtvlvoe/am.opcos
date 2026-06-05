## Why

代碼審查共發現 12 項問題，其中 8 項 CRITICAL/WARNING 直接導致：圖片全面顯示損壞（所有日文系列圖片 R2 key 互相覆蓋）、下架商品可透過直接 URL 存取、購物車數量可無限累加。這些問題在正式環境已影響用戶體驗與資料安全，需立即修復。

## What Changes

- **[圖片]** `slugifySeriesName` 改用 SHA-1 hash，修復日文系列名稱產生空字串導致 R2 key 碰撞的問題
- **[圖片]** `getDbSeriesImageMap` 同時儲存正規化 key，修復 seriesImageMap 簡繁不符導致 fallback 圖片永遠查不到
- **[圖片]** `getProductsByDate` 補上 `getDisplayImageUrls`，修復首頁按日期商品直接顯示 placeholder
- **[圖片]** `crawlAnismileProductsBySeriesName` 對 `series.name` 做 `toTraditionalChinese`，修復 series 欄位被覆寫為簡體
- **[圖片]** `SafeImage` 加 `useEffect` 在 `src` 改變時 reset `error`/`loaded` state
- **[圖片]** `getDeadlineList` fallback 改用 `find(!isPlaceholderImageUrl)` 取代 `urls[0]`
- **[圖片]** 刪除 `series-sync.ts` 內 `normalizeSourceImageUrl` local copy，改 import `@repo/database`
- **[安全]** 統一 admin UI bypass 條件為 `NODE_ENV === "development"`（對齊 API 層）
- **[安全]** `getAnismileProductById` 加 `inStock: true` 過濾，或在 page.tsx 回傳 404
- **[購物車]** `addToCart` upsert 加累加後總量上限 max(999)
- **[購物車]** `batchAddToCart` 加 `orderDeadline` 過期商品過濾
- **[業務]** `batchPatchProducts` 的 `discountRate` 包成 `new Prisma.Decimal()`
- **[業務]** `listWishlist` deadline 排序改為 `orderDeadline` 欄位
- **[業務]** `searchAnismileProducts` 預設加 `inStock: true` 過濾

## Non-Goals

- 不修改 `orderDeadline` 時區問題（需另行討論 DB 統一時區策略）
- 不修改 `next.config.ts` 自訂域名 remotePattern（`NEXT_PUBLIC_R2_PUBLIC_URL` 目前用預設值）
- 不新增 `seriesNameVariants` 異體字表（屬於獨立搜尋優化任務）
- 不修改 CSV janCode 空值（屬於功能補充，非 bug）
- 不拆分 `temp-r2-sync.ts` 路徑（屬於開發整潔任務）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `product-image-rendering`：R2 key slug 改用 hash、seriesImageMap 正規化 key、SafeImage error reset、getProductsByDate 補 getDisplayImageUrls、getDeadlineList placeholder 過濾、normalizeSourceImageUrl DRY 修正
- `admin-security`：staging bypass 條件統一為 development-only
- `series-product-sync`：crawlAnismileProductsBySeriesName series 欄位繁體一致性

## Impact

- Affected specs: product-image-rendering, admin-security, series-product-sync
- Affected code:
  - Modified:
    - packages/api/modules/anismile/lib/r2-image-cache.ts
    - packages/database/image-utils.ts
    - packages/api/modules/anismile/procedures/homepage.ts
    - packages/api/modules/anismile/lib/crawler.ts
    - packages/api/modules/anismile/lib/series-sync.ts
    - modules/shared/components/SafeImage.tsx
    - app/(authenticated)/admin/settings/page.tsx
    - app/(authenticated)/admin/orders/page.tsx
    - packages/database/prisma/queries/anismile.ts
    - packages/api/modules/anismile/procedures/products.ts
    - packages/api/modules/anismile/procedures/wishlist.ts
    - packages/api/modules/anismile/procedures/cart.ts
    - app/(public)/products/[id]/page.tsx
