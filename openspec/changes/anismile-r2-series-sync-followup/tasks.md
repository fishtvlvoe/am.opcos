## 1. Database schema migration for anismile_series

- [x] 1.1 執行 `cd packages/database && npx prisma migrate dev --name add_anismile_series_table`
  - **Behavior**: 根據現有 `schema.prisma` 中的 `AnismileSeries` model 產生一個新 migration，其 `migration.sql` 必須包含 `CREATE TABLE "anismile_series"` 以及所有對應欄位。遵循 design 中的「決策 1：使用 `prisma migrate dev` 產生 migration，而非 `db push`」與「決策 2：migration 命名遵循現有慣例」。
  - **Verification**: 檢查 `packages/database/prisma/migrations/20XXXXXXXXXXXXXX_add_anismile_series_table/migration.sql`，確認欄位包含 `id` (TEXT, PK), `name` (TEXT, UNIQUE), `image_url` (TEXT), `product_count` (INT), `last_synced_at` (TIMESTAMP), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP)。

- [x] 1.2 驗證 migration SQL 與 schema.prisma 一致性
  - **Behavior**: 比對 migration SQL 與 `schema.prisma` 中 `AnismileSeries` model 的欄位名稱、型別、索引、map 名稱是否完全一致。
  - **Verification**: `cat migration.sql` 與 `schema.prisma` 中的 model 定義逐欄比對，無差異。

- [x] 1.3 確認 migration 可套用
  - **Behavior**: 在本地開發資料庫執行 `npx prisma migrate dev`，確認無錯誤且 `anismile_series` 表成功建立。
  - **Verification**: `npx prisma migrate status` 顯示該 migration 為 Applied；使用資料庫 client 或 `npx prisma studio` 確認表存在。

## 2. Debug endpoint removal

- [x] 2.1 移除 `app/api/debug/r2-status/route.ts`
  - **Behavior**: 刪除該檔案，並檢查 `app/api/debug/` 目錄是否還有其他檔案。
  - **Verification**: `ls app/api/debug/` 不存在或為空；`git status` 不再顯示 `?? app/api/debug/`。

- [x] 2.2 確認無其他 debug 路由遺留
  - **Behavior**: 搜尋 `app/api/debug` 或類似的 debug endpoint 是否還有其他地方使用。
  - **Verification**: `grep -r "debug" app/api/ --include="*.ts"` 不顯示 `r2-status` 相關檔案。

## 3. 驗證與測試

- [x] 3.1 `pnpm type-check` 通過
  - **Behavior**: 執行 type check，確認刪除檔案與新增 migration 不影響型別正確性。
  - **Verification**: 命令回傳 0，無 type error。

- [x] 3.2 `pnpm test` 通過
  - **Behavior**: 執行測試，確認無 regression。
  - **Verification**: 命令回傳 0，或至少與變更前同樣數量的測試通過。

- [x] 3.3 `spectra validate anismile-r2-series-sync-followup --strict` 通過
  - **Behavior**: 執行 Spectra 驗證，確認所有 artifacts 一致。
  - **Verification**: 命令回傳 0，無 Critical/Warning finding。
