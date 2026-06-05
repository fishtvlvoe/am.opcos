<!--
Each task description MUST state:
- the behavior or contract being delivered (what is observably true when the
  task is complete), and
- the verification target that proves completion (test, CLI invocation,
  analyzer check, manual assertion, or content review).

File paths are supporting context for locating the work, never the task
itself. "Edit file X" is not a valid task — it is missing both behavior and
verification.
-->

## 1. R2 Key 碰撞修復

- [x] 1.1 實作 R2 series image key is collision-free：`slugifySeriesName`（`packages/api/modules/anismile/lib/r2-image-cache.ts`）改用 SHA-1 hex 前 16 碼（r2 key 改用 sha-1 hash（取代 regex slug）；R2 key 格式：`series/<16-hex>.jpg`），讓日文系列名稱產生不重複的 R2 key。驗證：新增單元測試確認 `getR2Key("鬼滅の刃") !== getR2Key("ワンピース")` 且兩者都不等於 `"series/.jpg"`

## 2. seriesImageMap 雙 key 正規化

- [x] 2.1 實作 Series image map lookup tolerates simplified-to-traditional variation：`getDbSeriesImageMap`（`packages/database/image-utils.ts`）採用 seriesImageMap 雙 key 策略（正規化 key 與原始 key 並存），對每個系列名稱同時存入原始名稱與 `toTraditionalChinese` 轉換後的繁體名稱，兩者都指向同一個 imageUrl；若轉換結果相同則只存一筆。需 import `toTraditionalChinese` from `packages/api/modules/anismile/lib/opencc`。驗證：新增單元測試確認 `map.get("截單")` 和 `map.get("截单")` 都回傳相同 imageUrl

## 3. 圖片顯示修復（並行）

- [x] [P] 3.1 實作 getProductsByDate applies image fallback before returning products：`getProductsByDate` handler（`packages/api/modules/anismile/procedures/homepage.ts`）在 map products 時補上 `getDisplayImageUrls(p, seriesImageMap)` 呼叫，並在 handler 頂部加入 seriesImageMap 查詢（與 `getDeadlineProducts` 相同模式）。驗證：`packages/api/modules/anismile/procedures/homepage.test.ts` 新增測試確認回傳商品的 imageUrls 第一項不為 placeholder URL
- [x] [P] 3.2 實作 Deadline section fallback skips placeholder images：`getDeadlineList` fallback path（`packages/api/modules/anismile/procedures/homepage.ts`）將 `imageUrl: urls[0] ?? ""` 改為 `imageUrl: urls.find(url => !isPlaceholderImageUrl(url)) ?? ""`。驗證：新增測試確認當 urls 只包含 placeholder URL 時回傳的 imageUrl 為空字串
- [x] [P] 3.3 實作 normalizeSourceImageUrl has a single implementation：刪除 `packages/api/modules/anismile/lib/series-sync.ts` 內的 local `normalizeSourceImageUrl` 函式，改 import `{ normalizeSourceImageUrl }` from `@repo/database`；確認所有呼叫點行為不變。驗證：`grep -n "function normalizeSourceImageUrl" packages/api/modules/anismile/lib/series-sync.ts` 無結果；build 通過

## 4. SafeImage 元件修復

- [x] [P] 4.1 實作 SafeImage resets error state when source URL changes：`modules/shared/components/SafeImage.tsx` 加入 `useEffect(() => { setError(false); setLoaded(false); }, [src])` 讓圖片來源改變時重置錯誤狀態。驗證：`modules/shared/components/safe-image.test.tsx`（新增）測試：給定 src 載入失敗後，將 src prop 改為另一個 URL，確認 onError 不再立即觸發（即 error 已被 reset）

## 5. 安全修復（並行）

- [x] [P] 5.1 實作 Visual auth bypass is development-only（admin bypass 統一為 development-only，admin bypass 統一）：`app/(authenticated)/admin/settings/page.tsx` 和 `app/(authenticated)/admin/orders/page.tsx` 的 bypass 條件從 `process.env.NODE_ENV !== "production"` 改為 `process.env.NODE_ENV === "development"`，與 `packages/api/orpc/procedures.ts` 一致。驗證：`grep -rn "!== .production" app/(authenticated)/admin/` 無匹配
- [x] [P] 5.2 實作 Public product page returns 404 for unlisted products（instock 過濾加在 page.tsx 層（not queries 層）；公開商品頁 inStock 保護）：`app/(public)/products/[id]/page.tsx` 在取得 product 後加入 `if (!product.inStock) { notFound(); }` 判斷；`app/(public)/series/[id]/page.tsx` 依相同模式處理系列下架。驗證：新增測試確認下架商品 id 的頁面呼叫 `notFound()`

## 6. 購物車安全（並行）

- [x] [P] 6.1 實作 addToCart cumulative quantity is bounded（addToCart 累加上限用 read-before-write，addToCart 上限）：`addToCart`（`packages/database/prisma/queries/anismile.ts`）在 upsert 前先 `findUnique` 取得現有 quantity，累加後用 `Math.min(existing + input, 999)` 限制上限。驗證：新增測試確認 quantity:600 呼叫兩次後 DB quantity === 999
- [x] [P] 6.2 實作 batchAddToCart skips products past order deadline：`batchAddToCart`（`packages/api/modules/anismile/procedures/wishlist.ts`）在加入購物車前加入 `orderDeadline` 過期檢查，跳過 `orderDeadline < today` 的商品。驗證：新增測試確認已過截單日商品不被加入購物車

## 7. 業務邏輯修復（並行）

- [x] [P] 7.1 實作 discountRate stored as Decimal（discountRate 型別）：`batchPatchProducts`（`packages/api/modules/anismile/procedures/products.ts`）將 `data.discountRate = input.discountRate` 改為 `data.discountRate = new Prisma.Decimal(input.discountRate)`。驗證：`packages/api/modules/anismile/procedures/products.test.ts` 新增測試確認 discountRate 欄位型別為 Decimal
- [x] [P] 7.2 實作 Wishlist deadline sort orders by order deadline（listWishlist deadline 排序）：`listWishlist`（`packages/api/modules/anismile/procedures/wishlist.ts`）`sortBy === "deadline"` 分支將排序欄位從 `product: { listingDate: "asc" }` 改為 `product: { orderDeadline: "asc" }`。驗證：新增測試確認回傳清單按 `orderDeadline` 升冪排列
- [x] [P] 7.3 實作 Search results exclude delisted products by default：`searchAnismileProducts`（`packages/database/prisma/queries/anismile.ts`）將 `inStock: onlyInStock ? true : undefined` 改為 `inStock: filters?.inStock === false ? undefined : true`，讓預設行為只回傳 `inStock: true` 商品。驗證：現有 search 測試不應有 inStock: false 商品出現；新增一個測試確認無 filter 時不回傳下架商品
- [x] [P] 7.4 實作 Background series crawl preserves Traditional Chinese series field：`crawlAnismileProductsBySeriesName`（`packages/api/modules/anismile/lib/crawler.ts`）對 `series.name` 呼叫 `toTraditionalChinese` 後再賦值給 `parsed.series`，與一般 `parseProductApi` 路徑對齊。驗證：新增測試確認 `crawlAnismileProductsBySeriesName` 寫入的 `series` 欄位為繁體（`截單` 而非 `截单`）

## 8. Build 驗證

- [x] 8.1 所有修改完成後跑 `pnpm run build` 確認 0 錯誤；跑 `pnpm test` 確認所有新增測試通過。驗證：`pnpm run build && pnpm test` 輸出 exit code 0
