## Why

Libon 平台（am.opcos.me）收到客戶反饋三個關鍵問題：網站載入極慢、首頁每日上架日期切換後商品列表未正確更新、以及系列詳情頁商品數量與原始網站（anismile.jp）嚴重不一致。經 Spectra Debug 四階段排查，鎖定根因為圖片完全未經 Next.js Image 優化、API 層過度並發與同步阻塞、以及 listingDate 數據不可靠導致日期 fallback 邏輯失效。本次變更旨在修復這三個問題，提升用戶體驗與數據一致性。

另外，進一步檢視平台後發現兩個功能缺口：（1）搜尋頁（/search）預設 `onlyInStock: true`，導致只顯示 149 件現貨商品，大量預購商品完全不可見；（2）anismile.jp 首頁的「即将截单」與「现货销售」兩個商品區塊在 Libon 首頁完全缺失，需一併實作。

## What Changes

1. **圖片優化**：將所有使用原生 `<img>` 載入外部圖片的組件改為 Next.js `<Image>`，啟用 lazy loading、響應式尺寸與自動格式轉換。
   - `modules/catalog/components/SeriesCard.tsx`
   - `modules/detail/ProductDetailPage.tsx`
   - `modules/admin/AdminProductsPage.tsx`

2. **API 層性能修復**：
   - 降低 `getSourceSeriesImageMap` 的並發請求數量（30 → 7）
   - 將系列詳情頁的即時爬蟲從同步阻塞改為背景觸發，避免阻塞用戶請求

3. **每日上架日期切換修復**：
   - 重構 `getSeriesList` 的日期 fallback 邏輯，優先以原始網站 `series_list/index` 返回的數據為準
   - 補充本地 `listingDate` 不可靠時的替代分組策略

4. **系列商品數量一致性修復**：
   - 提高 `crawlAnismileProductsBySeriesName` 的抓取上限（60 → 200）
   - 改進系列名稱匹配邏輯，減少因名稱細微差異導致的匹配失敗

5. **搜尋頁顯示全部商品**：
   - 移除 `app/(public)/search/page.tsx` 無查詢分支的 `onlyInStock: true` 限制
   - 改為顯示所有已同步商品（預購 + 現貨），保留過期截單商品的過濾邏輯

6. **首頁「即將截單」區塊**：
   - 新增 API procedure 呼叫 anismile.jp `POST /deadline_list/index`（源頭數據）
   - 新增前端首頁區塊展示即將截單的系列，對齊 anismile.jp 設計
   - 現有 `getDeadlineProducts`（本地 DB 查詢）作為 fallback 保留

7. **首頁「現貨銷售」區塊**：
   - 新增 API procedure 呼叫 anismile.jp `POST /instock/index`（源頭數據）
   - 新增前端首頁區塊展示現貨商品，對齊 anismile.jp 設計

## Non-Goals

- 不改動 anismile.jp 的同步排程機制（batch cursor 輪詢邏輯保持不變）
- 不引入新的圖片 CDN 或第三方圖片處理服務（僅利用 Next.js 內建優化）
- 不改動商品價格計算或會員折扣邏輯

## Capabilities

### New Capabilities

- `homepage-series-listing`: 首頁每日上架系列列表的日期切換與數據一致性
- `product-image-rendering`: 商品與系列圖片的優化載入與響應式渲染
- `series-product-sync`: 系列詳情頁的商品數據同步與即時補齊機制
- `search-product-coverage`: 搜尋頁顯示全部已同步商品（預購 + 現貨）而非僅現貨
- `homepage-deadline-section`: 首頁「即將截單」區塊，來源為 anismile.jp `/deadline_list/index`
- `homepage-instock-section`: 首頁「現貨銷售」區塊，來源為 anismile.jp `/instock/index`

### Modified Capabilities

（本次無需修改現有 capability，openspec/specs/ 目錄為空）

## Impact

- Affected code:
  - Modified:
    - `modules/catalog/components/SeriesCard.tsx`
    - `modules/detail/ProductDetailPage.tsx`
    - `modules/admin/AdminProductsPage.tsx`
    - `packages/api/modules/anismile/procedures/homepage.ts`
    - `packages/api/modules/anismile/procedures/products.ts`
    - `packages/api/modules/anismile/lib/crawler.ts`
    - `app/(public)/search/page.tsx`
    - `modules/home/HomePage.tsx`
  - New:
    - `modules/home/components/DeadlineSection.tsx`（即將截單前端組件，重構現有）
    - `modules/home/components/InstockSection.tsx`（現貨銷售前端組件）
  - Removed: （無）
- External APIs called (new):
  - `POST https://www.anismile.jp/deadline_list/index`
  - `POST https://www.anismile.jp/instock/index`
