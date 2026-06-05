## Context

anismile.jp 批發 API 提供兩個折扣欄位：`item.percent`（含 `status` 旗標，幾乎永遠為 `0`）與 `item.price_percent`（實際成本率，永遠有值）。現有 `parseProductApi` 以 `percent.status === 1` 作為主要判斷，導致 `price_percent` 僅作 fallback，可讀性差。監控與 sync log 統計功能已在上一次修正中實作完畢。

## Goals / Non-Goals

**Goals:**

- 反轉 `parseProductApi` 折扣優先順序：`price_percent` 為 primary，`item.percent` 為 fallback
- 建立 `external-api-crawler-audit` skill，規範外部 API crawler 的欄位盤點與驗證流程
- 建立 `nextjs-image-audit` skill，規範 Next.js `<Image>` domain 白名單檢查

**Non-Goals:**

- 不改變 `PriceDisplay` 前台邏輯
- 不新增 DB schema 或 migration
- 不修改 pricing backsolve 流程

## Decisions

**決策 1：反轉 `parseProductApi` 折扣優先順序**

`price_percent` 作為 primary，`item.percent`（status === 1）作為 fallback：

```typescript
// After（FIX）
const pricePercentRaw = item.price_percent != null ? Number.parseFloat(String(item.price_percent)) : null;
const percentValue = (pricePercentRaw != null && Number.isFinite(pricePercentRaw))
    ? pricePercentRaw
    : (item.percent?.status === 1 ? Number.parseFloat(item.percent.percent) : null);
```

**決策 2：折扣驗證門檻保持 10%**

現有 `crawlAnismileProductsWithStats` 已含 `discountRatio < 0.1` 警告，不變動。

**決策 3：sync log 折扣統計不重複實作**

`packages/sync/src/crawler.ts` 已記錄 `withDiscount`/`withoutDiscount`，不需改動。

**決策 4：兩個 skill 放 `~/.claude/skills/`**

`external-api-crawler-audit`：任何新增或修改外部 API crawler 時，必須完成欄位盤點、資料分佈驗證、成本/價格欄位公式核對。
`nextjs-image-audit`：任何新增 `<Image>` 元件或修改 `next.config` remotePatterns 時，必須確認 domain 已加入白名單。

## Implementation Contract

**行為**：修改後，任何 `price_percent` 有值的商品均會正確計算 `discountRate` 與 `costPrice`，不再依賴 `percent.status === 1`。

**介面**：`parseProductApi` 輸出型別不變，`discountRate: number | null` 與 `costPrice: number`。

**失敗模式**：`price_percent` 為 null 且 `percent.status !== 1` → `percentValue = null` → `discountRate = null`、`costPrice = originalPrice`（現有行為不變）。

**驗證**：
1. 單元測試：`item.price_percent = "80"` → `discountRate = 80`、`costPrice = originalPrice * 0.8`
2. 單元測試：`item.price_percent = null`、`item.percent = { status: 1, percent: "75" }` → `discountRate = 75`
3. `pnpm --filter @repo/api test` 全綠

## Risks / Trade-offs

若 anismile.jp 未來同時提供兩個欄位且值不同，現在的邏輯會忽略 `item.percent`。但因 `item.percent.status` 長期為 `0`，此風險極低。
