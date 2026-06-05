## Context

commit c6d2362 已經完整實作 R2 圖片快取與 series 同步業務邏輯，包含：
- `packages/api/modules/anismile/lib/r2-image-cache.ts`：上傳圖片到 Cloudflare R2
- `packages/api/modules/anismile/lib/series-sync.ts`：從 anismile.jp 抓取 series 列表並 upsert 到 DB
- `packages/database/prisma/schema.prisma`：新增 `AnismileSeries` model

但開發者遺漏了 `prisma migrate dev`，導致 migration 目錄中沒有對應的 SQL。同時遺留了 `app/api/debug/r2-status/route.ts` 除錯端點。

## Goals / Non-Goals

**Goals:**
- 產生正確的 Prisma migration，使 `anismile_series` 資料表可在 production 建立
- 移除開發遺留的 debug API endpoint
- 確保 migration SQL 與 schema.prisma 定義完全一致

**Non-Goals:**
- 不修改任何業務邏輯
- 不變更 schema.prisma 的 model 定義
- 不處理資料遷移（目前表中無資料）

## Decisions

### 決策 1：使用 `prisma migrate dev` 產生 migration，而非 `db push`

- **理由**：`migrate dev` 會產生可版本控制的 SQL 檔案，符合團隊現有 workflow（所有 schema 變更都透過 migrations）。`db push` 雖然快速但無法留下可 review 的 migration 記錄。
- **替代方案**：`db push` —  rejected，因為不產生 SQL 檔案，production 部署難以追蹤。

### 決策 2：migration 命名遵循現有慣例

- **理由**：現有 migration 使用 `YYYYMMDDHHMMSS_description` 格式（如 `20260524210000_anismile_commerce_enhancement`）。新 migration 應遵循同一格式。

## Implementation Contract

- **行為**：執行 `prisma migrate deploy` 後，資料庫中出現 `anismile_series` 資料表，其欄位與 `schema.prisma` 中 `AnismileSeries` model 完全一致。
- **介面 / 資料形狀**：不變更任何 API 合約。
- **失敗模式**：若生產環境已透過 `db push` 建立該表，`prisma migrate deploy` 可能因 table 已存在而失敗。解決方式：手動標記 migration 為已套用（`prisma migrate resolve`），或確認生產環境尚未 push。
- **驗收標準**：
  1. 新 migration 目錄中存在 `migration.sql`，內含 `CREATE TABLE "anismile_series"`
  2. `pnpm prisma migrate status` 顯示該 migration 為 `Applied`
  3. `app/api/debug/` 目錄不存在
  4. `pnpm type-check` 與 `pnpm test` 通過
- **範圍邊界**：
  - In scope：migration 產生、debug 端點移除
  - Out of scope：業務邏輯修改、環境變數設定、既有資料遷移

## Risks / Trade-offs

- **[Risk] 生產環境已存在 `anismile_series` 表（透過先前的 `db push`）** → Mitigation：部署前確認 production 資料庫 schema；若已存在，使用 `prisma migrate resolve --applied <migration_name>` 手動標記。
- **[Risk] migration SQL 與 schema.prisma 不一致** → Mitigation：產生後手動 diff 確認欄位、型別、索引、map 名稱完全一致。
