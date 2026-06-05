## Context

代碼審查發現 14 項問題分布在圖片 R2 pipeline、seriesImageMap 查詢、購物車安全、admin 認證四個子系統。這些 bug 部分已在正式環境影響用戶（圖片顯示損壞），部分為安全隱患（下架商品可直接存取）。所有修正均為行為修復，無 DB schema 變更，無新外部依賴。

## Goals / Non-Goals

**Goals:**

- 修復 R2 key 碰撞問題，讓所有系列圖片能正確寫入並讀取
- 修復 seriesImageMap 查詢失效，讓 fallback 圖片正確顯示
- 修復 getProductsByDate 缺漏 getDisplayImageUrls，讓首頁按日期商品正確顯示圖片
- 修復下架商品可透過直接 URL 存取的安全漏洞
- 統一 admin bypass 條件，消除 staging 環境安全假象
- 修復購物車累加上限與截單日過濾缺漏
- 修復 discountRate 型別不一致
- 統一 normalizeSourceImageUrl 為單一實作

**Non-Goals:**

- 不更改 DB schema 或執行 migration
- 不修改 orderDeadline 時區策略（需另行決策）
- 不增加新的系列異體字正規化規則
- 不改動 next.config.ts remotePattern（目前 NEXT_PUBLIC_R2_PUBLIC_URL 使用預設 *.r2.dev 值）

## Decisions

### R2 key 改用 SHA-1 hash（取代 regex slug）

**決定**：`slugifySeriesName` 改為取系列名稱的 SHA-1 hex 前 16 碼作為 key，格式 `series/<hash>.jpg`。

**理由**：
- 現有 regex `[^\w\s-]` 不含 Unicode，日文/中文字元全被清空，空字串導致多系列互相覆蓋
- Hash 對任意 Unicode 字串穩定、無碰撞風險、固定長度
- 備選方案「Unicode-aware slug」需引入外部套件（slugify），hash 只需 Node.js 內建 `crypto`

**影響**：所有已存入 R2 的舊 key（`series/<ascii-slug>.jpg`）與新 key 不同，舊圖片不會被刪除但也不會被讀取。`syncSeriesImageToR2` 在下次 sync 時自動以新 key 寫入，不需手動遷移。

### seriesImageMap 雙 key 策略（正規化 key 與原始 key 並存）

**決定**：`getDbSeriesImageMap` 在建立 Map 時，對每個系列名稱同時存入原始名稱（key）和簡繁正規化後名稱（key），兩者都指向同一個 imageUrl。

**理由**：
- `anismileSeries.name` 儲存的是 anismile.jp 原始名稱（可能含簡體字如「截单」）
- `anismileProduct.series` 儲存的是 toTraditionalChinese 結果（「截單」）
- `getSeriesFallbackImage` 用 product.series 查 map，需要 map 裡有對應的繁體 key
- 備選「在查詢時對雙方正規化」需修改更多呼叫點；雙 key 只需修改 `getDbSeriesImageMap` 一處

**正規化方式**：用現有的 `opencc` 套件（已在 `lib/opencc.ts`）將 `s.name` 轉繁體後也存入 map，若轉換結果與原始名稱相同則不重複存。

### Admin bypass 統一為 development-only

**決定**：`app/(authenticated)/admin/settings/page.tsx` 與 `app/(authenticated)/admin/orders/page.tsx` 的 bypass 條件從 `NODE_ENV !== "production"` 改為 `NODE_ENV === "development"`。

**理由**：
- API 層（packages/api/orpc/procedures.ts）已用 `NODE_ENV === "development"`
- 兩層不一致讓 staging 環境出現「UI 無保護但 API 有保護」的假安全狀態
- staging 環境應使用 seed account 登入測試，而非 bypass

### inStock 過濾加在 page.tsx 層（not queries 層）

**決定**：`app/(public)/products/[id]/page.tsx` 在取得 product 後，若 `!product.inStock` 則呼叫 `notFound()`（Next.js 回傳 404）。`getAnismileProductById` 查詢層不加過濾。

**理由**：
- Admin 查詢用同一個 `getAnismileProductById`，加在 query 層會讓 admin 也看不到下架商品
- page.tsx 是公開頁面的入口，判斷在此最清楚
- series/[id] page.tsx 也需同樣處理

### addToCart 累加上限用 read-before-write

**決定**：`addToCart` 在 upsert 前先 `findUnique` 取得現有 quantity，累加後取 `Math.min(existing + input, 999)`，再 `upsert`。

**理由**：
- 直接 `increment` 後 `Math.min` 需要 Prisma 不支援的 expression，read-before-write 最直接
- 購物車為單一 user 操作，concurrent race 機率低，不需 serializable transaction

## Implementation Contract

### R2 key 格式

- `getR2Key(seriesName)` 回傳 `series/<sha1-hex-16>.jpg`
- `getR2PublicUrl(seriesName)` 回傳 `${R2_PUBLIC_URL}/series/<sha1-hex-16>.jpg`
- 驗證：`getR2Key("鬼滅の刃") !== getR2Key("ワンピース")`（不碰撞）；`getR2Key("") !== "series/.jpg"`

### seriesImageMap 查詢

- `getDbSeriesImageMap()` 對含「截单」的系列名稱，map 同時有 `"截单"` key 和 `"截單"` key
- `getSeriesFallbackImage(product)` 對 series = `"DEATH NOTE・ステラノーツ・6月28日截單"` 能查到 imageUrl
- 驗證：單元測試確認 map.get(toTraditionalChinese(series.name)) 有值

### 公開商品頁 inStock 保護

- GET `/products/[id]`（下架商品 id）回傳 HTTP 404
- GET `/series/[id]`（下架系列）回傳 HTTP 404 或隱藏商品
- 驗證：`curl /products/<offline-id>` 回傳 404

### Admin bypass 統一

- staging 環境（`NODE_ENV=test` 或 `NODE_ENV=staging`）設定 `ANISMILE_VISUAL_TEST_BYPASS_AUTH=1`，admin 頁面回傳 401/redirect，不再跳過 auth
- 驗證：NODE_ENV=test 環境下存取 `/admin/settings` 被 redirect

### addToCart 上限

- 同一商品 `addToCart` 呼叫 N 次後，`quantity` 上限為 999，不超過
- 驗證：連續呼叫 2 次 `quantity: 600`，DB 中 quantity = 999

### discountRate 型別

- `batchPatchProducts` 送出 `discountRate: 0.85`，DB 儲存值為 `Prisma.Decimal("0.85")`
- 驗證：查詢確認 typeof stored value 是 Decimal 而非 JS float

### listWishlist deadline 排序

- `sortBy: "deadline"` 回傳的商品按 `orderDeadline` 升冪排列
- 驗證：單元測試確認第一個商品的 `orderDeadline` <= 第二個

## Risks / Trade-offs

- [R2 key 變更] 舊 key 的圖片不會自動清除，R2 儲存桶會累積孤立物件 → 可另行跑清理腳本（out of scope）
- [雙 key 策略] Map size 增加約一倍，但 seriesImageMap 最多幾百條，記憶體影響可忽略
- [read-before-write in addToCart] 高並發時理論上可超過 999（race window），但購物車場景實務上不發生 → 可接受
