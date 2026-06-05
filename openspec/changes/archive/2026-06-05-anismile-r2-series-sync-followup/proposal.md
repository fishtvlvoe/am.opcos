## Problem

R2 圖片快取與來源網站 series 同步功能（commit c6d2362）已經寫入程式碼，但存在兩個會導致 production 運作異常或留下安全隱患的問題：

1. **Prisma migration 缺失**：`schema.prisma` 已新增 `AnismileSeries` model，但 `prisma/migrations/` 中完全沒有建立 `anismile_series` 資料表的 SQL。若生產環境尚未執行 `prisma db push`，每次同步觸發 `upsert` 時會直接報錯，導致 R2 圖片快取機制完全失效。
2. **Debug 端點未清理**：`app/api/debug/r2-status/route.ts` 仍留在 working tree 中（untracked），該端點暴露 S3/R2 憑證存在狀態與 bucket 內容列舉結果，不應存在於 production 程式碼中。

## Root Cause

開發者在實作 series-sync 與 R2 整合時，更新了 Prisma schema 與相關業務邏輯，但遺漏了 `prisma migrate dev` 步驟。同時，本地除錯用的 R2 狀態檢查 API 在驗證完成後未被移除。

## Proposed Solution

1. **補產 Prisma migration**：針對 `AnismileSeries` model 產生一個新的 migration，確保 `anismile_series` 資料表在 production 與本地開發環境都能正確建立。
2. **移除 debug 端點**：刪除 `app/api/debug/r2-status/route.ts`，一併檢查並清理 `app/api/debug/` 目錄。
3. **驗證 schema 一致性**：確認 migration SQL 與 `schema.prisma` 的 `AnismileSeries` 定義完全一致（欄位、型別、索引、map）。

## Capabilities

### New Capabilities

- `anismile-series-schema`: 確保 `anismile_series` 資料表有正確的 Prisma migration，並清理開發遺留的 debug 端點。

### Modified Capabilities

（本次無需修改現有 capability，openspec/specs/ 目錄為空）

## Non-Goals

- 不修改 R2 上傳邏輯（`r2-image-cache.ts`）
- 不修改 series 同步業務邏輯（`series-sync.ts`、`crawler.ts`）
- 不修改前端圖片渲染邏輯（`image-utils.ts`、`SafeImage`）
- 不新增或變更任何 API 合約與對外 capability
- 不處理 Vercel 環境變數設定（假設 `.env.local` 與 production 已正確配置）

## Success Criteria

- [ ] `packages/database/prisma/migrations/` 下存在一個新 migration，其 `migration.sql` 包含 `CREATE TABLE "anismile_series"`。
- [ ] `app/api/debug/r2-status/route.ts` 被移除，且 `app/api/debug/` 目錄不再存在於 repo 中。
- [ ] `pnpm type-check` 通過。
- [ ] `pnpm test` 通過（或至少與變更前同樣數量的測試通過）。
- [ ] `spectra validate anismile-r2-series-sync-followup --strict` 通過。

## Impact

- Affected code:
  - New: `packages/database/prisma/migrations/20XXXXXXXXXXXXXX_add_anismile_series_table/migration.sql`
  - Modified: `packages/database/prisma/schema.prisma`（僅確認一致性，不變更定義）
  - Removed: `app/api/debug/r2-status/route.ts`
