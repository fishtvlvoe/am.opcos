## Why

anismile.jp crawler 定義了 `price_percent` 欄位，但 `parseProductApi` 邏輯中只讀取 `item.percent`（其 `status` 幾乎永遠是 `0`），導致所有產品 `discountRate = null`、`costPrice = originalPrice`，前台顯示「目前未加成」。這是一個潛伏已久的資料正確性缺陷，需要立即修復並建立預防機制避免未來再發生。

## What Changes

- 修復 `packages/api/modules/anismile/lib/crawler.ts`：`parseProductApi` 改為以 `price_percent` 為主要折扣來源，`item.percent` 為輔助後備
- 新增 crawler 級別的資料驗證：統計 crawl 結果中有折扣的產品比例，若低於 10% 則發出警告
- 新增 sync log 折扣統計：`runSync` 記錄 `withDiscount` / `withoutDiscount`，若比例異常則寫入 `errorMessage` 以便監控
- 新增 `external-api-crawler-audit` skill：任何新增或修改外部 API crawler 的任務，必須完成欄位盤點、資料分佈驗證、成本/價格欄位公式核對，並在異常時報警
- 建立 Next.js `<Image>` 檢查 skill `nextjs-image-audit`（本次修正時同步建立）

## Non-Goals

- 不改變前台顯示邏輯（PriceDisplay 等）
- 不改變 pricing backsolve 流程
- 不新增新的資料表或 schema migration

## Capabilities

### New Capabilities

- `external-api-crawler-audit`: 外部 API crawler 的開發與審查規範

### Modified Capabilities

- `series-product-sync`: 新增「折扣欄位必須正確解析與驗證」的要求

## Impact

- `packages/api/modules/anismile/lib/crawler.ts`
- `packages/sync/src/crawler.ts`
- `packages/database/prisma/queries/anismile.ts`（series name matching）
- `packages/api/modules/anismile/lib/crawler.test.ts`
