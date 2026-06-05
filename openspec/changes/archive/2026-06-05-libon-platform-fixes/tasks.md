## 1. 圖片優化：SeriesCard 使用 Next.js Image

- [x] [P] 1.1 SeriesCard 使用 Next.js Image 載入系列圖片（實現 "Series cards use optimized image loading" requirement）
  - **Behavior**: `modules/catalog/components/SeriesCard.tsx` 中的 `<img>` 改為 `next/image` 的 `<Image>` 組件，啟用 `fill` + `sizes` + `object-cover`，圖片 lazy loading 生效；當系列無可用圖片 URL 時，顯示 placeholder 文字「系列圖片」而非破圖。對應 design 決策「決策 1：使用 Next.js `<Image>` 而非原生 `<img>`」。
  - **Verification**: 手動檢查首頁系列卡片，確認圖片 URL 變為 `/_next/image?url=...` 格式，Lighthouse LCP 改善；確認無圖片的系列卡片顯示 placeholder 文字

## 2. 圖片優化：ProductDetailPage 相關產品區塊

- [x] [P] 2.1 ProductDetailPage 相關產品圖片使用 Next.js Image（實現 "Product detail images use optimized loading" requirement）
  - **Behavior**: `modules/detail/ProductDetailPage.tsx` 中相關產品區塊的 `<img>` 改為 `<Image>`，指定適當的 `width`/`height` 或 `fill` + `sizes`。對應 design 決策「決策 1：使用 Next.js `<Image>` 而非原生 `<img>`」。
  - **Verification**: 手動檢查商品詳情頁底部相關產品，確認圖片經 Next.js 優化載入

## 3. 圖片優化：AdminProductsPage 產品縮圖

- [x] [P] 3.1 AdminProductsPage 產品縮圖使用 Next.js Image（實現 "Admin product images use optimized loading" requirement）
  - **Behavior**: `modules/admin/AdminProductsPage.tsx` 中產品表格縮圖的 `<img>` 改為 `<Image width={40} height={40}>`。對應 design 決策「決策 1：使用 Next.js `<Image>` 而非原生 `<img>`」。
  - **Verification**: 手動檢查管理後台產品列表，確認縮圖正確顯示且經優化

## 4. API 層性能：降低並發請求數量

- [x] 4.1 getSourceSeriesImageMap 並發數從 30 降至 7（實現 "Limit concurrent source API requests" requirement）
  - **Behavior**: `packages/api/modules/anismile/procedures/homepage.ts` 中 `getSourceSeriesImageMap` 的 `Array.from({ length: 30 })` 改為 `Array.from({ length: 7 })`。對應 design 決策「決策 2：`getSourceSeriesImageMap` 並發數量從 30 降至 7」。
  - **Verification**: 檢查 `homepage.ts` 中 `length: 30` 已改為 `length: 7`；`products.ts` 原本已是 7，無需修改

## 5. 每日上架日期切換修復

- [x] 5.1 重構 getSeriesList 優先使用原始網站數據（實現 "Date tab switching reflects correct series list" requirement）
  - **Behavior**: `homepage.ts` 的 `getSeriesList` 中，當 `series_list/index` 返回 `items` 時直接使用原始數據作為系列列表，本地 DB 僅用於補充圖片 fallback。對應 design 決策「決策 3：日期切換邏輯優先使用原始網站數據」。
  - **Verification**: 手動測試首頁切換 6月2日/1日 tab，確認商品列表與 anismile.jp 同日期一致

- [x] 5.2 確保原始 API 失敗時正確 fallback 到本地 DB（實現 Fallback to local DB when source API is unavailable requirement）
  - **Behavior**: 當 anismile.jp `series_list/index` API 超時或返回非 OK 狀態時，`getSeriesList` 自動回退到本地資料庫查詢。對應 design 決策「決策 3：日期切換邏輯優先使用原始網站數據」與「失敗模式」第一條。
  - **Verification**: 模擬原始 API 失敗（如斷網或改 URL 為無效地址），確認首頁仍顯示本地資料，且回應包含 fallback 標記

- [x] 5.3 移除不必要的 shouldUseSyncedDateFallback 複雜判斷（實現 Date tab switching reflects correct series list requirement）
  - **Behavior**: 簡化 `getSeriesList` 中的日期 fallback 邏輯，移除依賴不可靠 `listingDate` 的 `getSyncedSeriesListByDate` 作為主要數據源的場景。對應 design 決策「決策 3：日期切換邏輯優先使用原始網站數據」。
  - **Verification**: 檢查 `shouldUseSyncedDateFallback` 變數與 `getSyncedSeriesListByDate` 的調用點，確認僅在原始 API 完全失敗時才 fallback

## 6. 系列商品同步：提高爬蟲上限與背景觸發

- [x] 6.1 crawlAnismileProductsBySeriesName limit 從 60 提高到 200（實現 "Series detail page shows complete product count" requirement）
  - **Behavior**: `packages/api/modules/anismile/lib/crawler.ts` 中 `crawlAnismileProductsBySeriesName` 的 `limit` 默認值從 60 改為 200。對應 design 決策「決策 5：`crawlAnismileProductsBySeriesName` limit 從 60 提高到 200」。
  - **Verification**: 檢查函數簽名中 `limit = 200`（或 `limit = 60` 已移除）

- [x] 6.2 listProducts 即時爬蟲改為背景觸發（實現 "Background crawling for missing series products" requirement）
  - **Behavior**: `packages/api/modules/anismile/procedures/products.ts` 中 `listProducts` 的同步阻塞爬蟲邏輯改為：當本地 DB 中該系列商品數量**少於 5 件**時，先返回本地已有數據，同時異步觸發背景爬蟲補齊（limit = 200）。對應 design 決策「決策 4：即時爬蟲改為背景觸發」與 spec 中「fewer than 5 products」觸發條件。
  - **Verification**: 手動測試訪問本地數據為空的系列，確認頁面立即響應（不白屏等待），30 秒後重新整理顯示完整商品

- [x] 6.3 改進系列名稱匹配邏輯（實現 "Improved series name matching" requirement）
  - **Behavior**: `packages/api/modules/anismile/lib/crawler.ts` 中擴展 `normalizeSeriesLookup` 的字符正規化範圍，或調整 `listAnismileProducts` 中的 series 匹配邏輯，減少因名稱細微差異導致的匹配失敗。
  - **Verification**: 檢查 `normalizeSeriesLookup` 涵蓋更多標點變體，手動測試系列匹配正確率

## 7. 測試與驗收

- [x] 7.1 Lighthouse 性能基準測試（驗證 design 中「行為」第一條與「驗收標準」第一條：LCP 顯著改善）
  - **Behavior**: 首頁 LCP 改善至少 30%，圖片相關性能指標（如 Total Blocking Time、Speed Index）無退化。對應 design 中「接口 / 數據形狀」不變、「失敗模式」下圖片優化失敗時顯示 placeholder、「範圍邊界」內僅修改前端圖片載入方式。
  - **Verification**: 運行 `npm run build && npm start`，使用 Lighthouse CLI 或 Chrome DevTools 測量首頁性能，記錄 LCP 前後對比

- [x] 7.2 日期切換手動驗收測試（驗證 design 中「驗收標準」第二條）
  - **Behavior**: 切換每日上架日期 tab（6月3日/2日/1日），每個日期的系列列表與 anismile.jp 首頁對應日期一致
  - **Verification**: 手動對比 am.opcos.me 與 anismile.jp 首頁的每日上架區塊，記錄每個日期 tab 的系列名稱與數量

- [x] 7.3 系列商品數量一致性驗收測試（驗證 design 中「驗收標準」第三條）
  - **Behavior**: 訪問「アイカツ! 10th STORY ～未来へのSTARWAY～」系列，商品數量接近 72 件（差距在 5% 以內）
  - **Verification**: 手動對比 am.opcos.me 系列頁與 anismile.jp 系列頁的商品數量，確認差距在合理範圍

## 8. 搜尋頁：顯示全部已同步商品

- [x] 8.1 移除搜尋頁無查詢分支的 onlyInStock 限制（實現 "Search page displays all synced products by default" requirement）
  - **Behavior**: `app/(public)/search/page.tsx` 中 `listAnismileProducts` 呼叫的 `onlyInStock: true` 改為 `false`（或移除此參數），使搜尋頁在無關鍵字時同時顯示預購與現貨商品；過期截單商品（`orderDeadline` 已過今日）仍排除。快速篩選「即將截單」與「現貨」仍可獨立勾選。
  - **Verification**: 訪問 am.opcos.me/search（無查詢詞），確認商品總數明顯多於原本的 149 件，且含有預購商品（`inStock: false` 但 `orderDeadline` 未過期）

- [x] 8.2 確認關鍵字搜尋範圍同步擴大（實現 "Keyword search behavior is unchanged" requirement）
  - **Behavior**: `searchAnismileProducts` 函式中 `onlyInStock` 預設邏輯（`packages/database/prisma/queries/anismile.ts:1426`）調整為：無 `showUnavailable` 參數時，**不強制** `inStock: true`，僅排除過期截單商品。讓關鍵字搜尋也能找到預購商品。
  - **Verification**: 搜尋已知預購商品的系列名稱，確認結果中出現預購商品

## 9. 首頁：即將截單區塊

- [x] 9.1 新增 getDeadlineList API procedure 呼叫 /deadline_list/index（實現 Homepage displays an "Upcoming Deadlines" section sourced from anismile.jp requirement）
  - **Behavior**: 在 `packages/api/modules/anismile/procedures/homepage.ts` 新增 `getDeadlineList` procedure（路徑 `GET /anismile/homepage/deadline-list`）。此 procedure 呼叫 `POST https://www.anismile.jp/deadline_list/index`（dayOffset=0）並回傳序列化的系列截單清單。anismile.jp 每個 item 格式：`{ id, name, file: { url, thumb }, product_count, work_title, manufacturer, earliest_deadline, deadline_date }`。圖片 URL 需透過 `normalizeSourceImageUrl` 正規化。source API 不可用時，fallback 到現有 `getDeadlineProducts` 的本地 DB 查詢結果並回傳空 items 與 `usedFallback: true`。
  - **Verification**: 本地 `curl -X GET "http://localhost:3000/api/anismile/homepage/deadline-list"` 回傳非空 `items` 陣列，每個 item 包含 `name`, `imageUrl`, `deadlineDate`, `productCount` 欄位

- [x] 9.2 重構現有 DeadlineSection.tsx 改用系列卡片（實現 "Deadline date display" requirement）
  - **Behavior**: `modules/home/components/DeadlineSection.tsx` 目前呼叫 `getDeadlineProducts`（本地 DB，顯示商品卡片）。重構為呼叫新的 `getDeadlineList` API，改為渲染**系列卡片**（對齊 anismile.jp 設計）。每張卡片顯示：系列名稱、截單日期（「X月Y日截單」紅色標籤）、商品件數。點擊卡片導向 `/series/<slug>` 或帶系列篩選的搜尋頁。無圖片時顯示 placeholder，不崩潰。
  - **Verification**: Chrome MCP 截圖首頁，確認「即將截單」區塊顯示系列卡片（非商品卡片）且含截單日期標籤

- [x] 9.3 在 app/(public)/page.tsx 預取截單列表數據（實現 section integration requirement）
  - **Behavior**: `app/(public)/page.tsx` 的 `Promise.all` 新增 `fetchPublicJson("/api/anismile/homepage/deadline-list", ...)` 預取，並將結果作為 `initialDeadlineData` prop 傳入 `<HomePage>`，避免客戶端首次載入白屏。`DeadlineSection` 優先使用 SSR 數據再接 client query。
  - **Verification**: 查看首頁 HTML source，確認截單區塊有 SSR 渲染的系列名稱（不需要 JS 才可見）

## 10. 首頁：現貨銷售區塊

- [x] 10.1 新增 getInstockList API procedure 呼叫 /instock/index（實現 Homepage displays a "In-Stock Products" section sourced from anismile.jp requirement）
  - **Behavior**: 在 `packages/api/modules/anismile/procedures/homepage.ts` 新增 `getInstockList` procedure（路徑 `GET /anismile/homepage/instock-list`）。此 procedure 呼叫 `POST https://www.anismile.jp/instock/index`，回傳最多 10 件商品。每個 item 格式：`{ id, name, price, file: { url, thumb }, manufacturer: { name }, deadline_date }`。對每個 item，嘗試從本地 DB 以 `sourceId`（等同 item.id）查找 `sellingPrice`；登入用戶顯示本地售價，未登入則隱藏。source API 不可用時回傳 `items: []`（前端不渲染此區塊）。
  - **Verification**: 本地 `curl -X GET "http://localhost:3000/api/anismile/homepage/instock-list"` 回傳 `items` 陣列（最多 10 件），每個 item 包含 `id`, `name`, `imageUrl` 欄位

- [x] 10.2 新增首頁「現貨銷售」前端 section 組件（實現 "Price display based on login state" requirement）
  - **Behavior**: 建立 `modules/home/components/InstockSection.tsx`，呼叫 `getInstockList` API 取得數據後渲染商品卡片（可複用現有 `ProductCard` 組件）。每張卡片顯示：商品名稱（翻譯版若有，否則原文）、商品圖片、售價（登入可見）或「登入後查看」。點擊導向 Libon 商品詳情頁 `/products/<id>`。API 回傳空 items 時，整個 section 不渲染（非空容器）。
  - **Verification**: Chrome MCP 截圖首頁，確認「現貨銷售」區塊可見並顯示商品卡片；未登入時卡片無價格數字

- [x] 10.3 將 InstockSection 加入 HomePage.tsx（實現 "Source API unavailable" failure requirement）
  - **Behavior**: 在 `modules/home/HomePage.tsx` 中，於 `<DeadlineSection>` 下方加入 `<InstockSection>` 組件。`getInstockList` 失敗時整個 `<InstockSection>` 不渲染（組件內 error boundary 或 isPending + isError → return null），不影響頁面其他部分。
  - **Verification**: 訪問 am.opcos.me 首頁，確認頁面中有「現貨銷售」標題與商品卡片（至少 5 件）

## 11. 新功能驗收測試

- [x] 11.1 搜尋頁全量商品驗收
  - **Behavior**: am.opcos.me/search 顯示的商品總數明顯超過 149 件，含預購商品，快速篩選功能正常
  - **Verification**: Chrome MCP 截圖 /search 頁，確認總件數與預購商品可見

- [x] 11.2 首頁兩個新區塊視覺驗收
  - **Behavior**: 首頁從上至下依序：每日上架 → 即將截單 → 現貨銷售，三個區塊均有內容且不重疊
  - **Verification**: Chrome MCP 捲動截圖首頁全頁，確認三個區塊均可見
