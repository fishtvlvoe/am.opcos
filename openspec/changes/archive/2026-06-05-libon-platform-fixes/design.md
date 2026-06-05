## Context

Libon 平台（am.opcos.me）是面向批發客戶的動漫商品採購平台，數據來源為 anismile.jp。目前平台存在三個影響用戶體驗的問題：

1. **性能問題**：首頁與系列詳情頁載入緩慢，經排查主因為圖片完全未經優化（原生 `<img>` 直接載入 `img.anismile.jp` 原始大圖），以及 API 層的過度並發請求與同步阻塞爬蟲。
2. **日期切換失效**：首頁「每日上架」區塊的日期 tab（如 6月3日/2日/1日）切換後，商品列表未正確更新。根因為 `getSeriesList` 的 fallback 邏輯依賴不穩定的 `listingDate` 字段。
3. **商品數量不一致**：點進系列後顯示的商品數量遠少於原始網站（如 13 件 vs 72 件）。根因為本地同步不完整，以及即時爬蟲限制過低。

## Goals / Non-Goals

**Goals:**

1. 將所有外部圖片載入改為 Next.js `<Image>`，啟用 lazy loading、響應式尺寸與自動格式轉換
2. 降低 `getSourceSeriesImageMap` 的並發請求數量，減少 API 層阻塞
3. 重構日期切換邏輯，確保切換日期後商品列表正確反映該日上架的系列
4. 提高即時爬蟲抓取上限，改善系列詳情頁商品數量一致性
5. 將系列詳情頁的即時爬蟲從同步阻塞改為背景觸發

**Non-Goals:**

- 不改動 anismile.jp 的 batch cursor 同步排程機制
- 不引入額外圖片 CDN 或第三方圖片處理服務
- 不改動商品價格計算、會員折扣或購物車邏輯
- 不修改資料庫 schema

## Decisions

### 決策 1：使用 Next.js `<Image>` 而非原生 `<img>`

**選擇**：將 `SeriesCard`、`ProductDetailPage`、`AdminProductsPage` 中的 `<img>` 改為 Next.js `<Image>`。

**理由**：
- Next.js `images.remotePatterns` 已正確配置 `img.anismile.jp`，具備使用條件
- `<Image>` 自動提供 lazy loading、響應式尺寸（srcset）、WebP/AVIF 格式轉換、以及 blur placeholder
- 無需額外引入第三方服務，最小侵入性

**替代方案考慮**：
- 使用 Cloudflare Images / Imgix 等第三方 CDN：拒絕，需要額外成本與配置，且 Next.js 內建優化已足夠
- 自建圖片代理：拒絕，增加運維複雜度

### 決策 2：`getSourceSeriesImageMap` 並發數量從 30 降至 7

**選擇**：將 `homepage.ts` 中的 `Array.from({ length: 30 })` 改為 `Array.from({ length: 7 })`。

**理由**：
- 首頁「每日上架」區塊只顯示近 7 天的日期 tab，30 天請求屬於過度抓取
- `products.ts` 中的同一函數已使用 7，應保持一致
- 減少並發可降低首次載入延遲與 anismile.jp 的請求壓力

### 決策 3：日期切換邏輯優先使用原始網站數據

**選擇**：重構 `getSeriesList`，當原始網站 `series_list/index` 返回 `items` 時，直接使用其數據作為系列列表，僅將本地 DB 作為「補圖片」的 fallback。

**理由**：
- 原始網站的 `series_list/index` 是每日上架權威數據源
- 本地 `listingDate` 不可靠（大量商品缺失 `add_time`，fallback 到同步時間），導致按日期分組錯誤
- 保持原始數據為準可確保與 anismile.jp 首頁一致

**替代方案考慮**：
- 修復本地 `listingDate` 數據：拒絕，需要回溯所有歷史商品，成本過高
- 使用 `createdAt` 替代 `listingDate`：拒絕，`createdAt` 是同步時間，非真實上架時間

### 決策 4：即時爬蟲改為背景觸發

**選擇**：當系列詳情頁本地數據為空時，先返回空結果，同時異步觸發 `crawlAnismileProductsBySeriesName` 進行背景補抓。

**理由**：
- 同步阻塞爬蟲會讓用戶等待數秒到數十秒，體驗極差
- 背景觸發可讓頁面立即響應，後續刷新即可看到補齊的數據
- 可結合輪詢或重新整理機制讓用戶感知到數據更新

**替代方案考慮**：
- 保持同步阻塞但提高超時：拒絕，用戶仍然需要等待
- 預先同步所有熱門系列：拒絕，需要大量額外資源與排程邏輯

### 決策 5：`crawlAnismileProductsBySeriesName` limit 從 60 提高到 200

**選擇**：將函數參數 `limit` 的默認值從 60 改為 200。

**理由**：
- 客戶反饋的系列有 72 件商品，60 的上限導致無法完整同步
- 200 可覆蓋絕大多數系列（anismile.jp 單系列通常不超過 150 件）
- 該函數僅在本地數據為空時觸發，影響範圍可控

## Implementation Contract

### 行為

1. **圖片優化後**：用戶訪問首頁與系列詳情頁時，圖片應使用 Next.js Image 優化載入，LCP（Largest Contentful Paint）應顯著改善，移動端圖片載入體積應減少
2. **日期切換後**：點擊「6月2日上架」tab 後，商品系列列表應正確顯示該日期上架的系列，與 anismile.jp 首頁一致
3. **系列詳情頁**：點進系列後顯示的商品數量應與原始網站一致（或差距在 5% 以內），首次訪問時不應出現長時間白屏等待

### 接口 / 數據形狀

- `getSeriesList` API 的輸入輸出形狀保持不變，僅內部邏輯調整
- `listProducts` API 的輸入輸出形狀保持不變，僅內部爬蟲觸發方式調整
- `SeriesCard`、`ProductDetailPage`、`AdminProductsPage` 的 props 接口保持不變

### 失敗模式

- 若 anismile.jp `series_list/index` API 不可用，`getSeriesList` 應回退到本地 DB 查詢（現有行為）
- 若背景爬蟲失敗，系列詳情頁應顯示空列表並記錄錯誤日誌，不影響用戶體驗
- 若 Next.js Image 優化失敗（如外部圖片不可訪問），應顯示 placeholder 而非崩潰

### 驗收標準

1. Lighthouse 性能審核中，首頁 LCP 從當前值改善至少 30%
2. 手動測試：切換每日上架日期 tab，商品列表應正確變化（與 anismile.jp 同日期對比）
3. 手動測試：訪問「アイカツ! 10th STORY ～未来へのSTARWAY～」系列，商品數量應接近 72 件
4. 背景爬蟲觸發後，30 秒內重新整理頁面應顯示補齊的商品

### 範圍邊界

**In Scope**：
- 3 個前端組件的圖片載入方式修改
- `homepage.ts` 的 `getSeriesList` 與 `getSourceSeriesImageMap` 邏輯修改
- `products.ts` 的 `listProducts` 爬蟲觸發方式修改
- `crawler.ts` 的 `crawlAnismileProductsBySeriesName` limit 修改

**Out of Scope**：
- 同步排程（batch cursor）邏輯
- 資料庫 schema 變更
- 價格計算邏輯
- 購物車與訂單流程

## Risks / Trade-offs

- **[Risk] Next.js Image 對外部圖片的優化依賴 Next.js 伺服器** → [Mitigation] `img.anismile.jp` 已加入 `images.remotePatterns`，Vercel 部署環境自動處理優化
- **[Risk] 背景爬蟲觸發後用戶首次看到空列表** → [Mitigation] 可在 UI 顯示「正在同步商品數據...」提示，並建議用戶重新整理
- **[Risk] 提高爬蟲 limit 到 200 可能增加 anismile.jp 的請求壓力** → [Mitigation] 該函數僅在本地數據為空時觸發，且已有 delay + concurrency 控制
- **[Risk] 日期切換改為優先使用原始網站數據後，若原始網站 API 慢或不可用，首頁載入會受影響** → [Mitigation] 保留本地 DB fallback，並設置合理的 fetch timeout
