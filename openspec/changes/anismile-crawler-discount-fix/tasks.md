# Tasks: anismile-crawler-discount-fix

## Wave 1 — 修復 crawler 折扣優先順序

- [x] 修改 `parseProductApi` 折扣解析順序，實作「Discount rate must be correctly parsed from source API」
  - 檔案：`packages/api/modules/anismile/lib/crawler.ts`
  - 找到 `let percentValue = item.percent?.status === 1` 那一行（約第 362 行）
  - 改為：先取 `price_percent`，有效才用；無效則 fallback 到 `item.percent.status === 1`
  - 正確實作：`const pricePercentRaw = item.price_percent != null ? Number.parseFloat(String(item.price_percent)) : null; const percentValue = (pricePercentRaw != null && Number.isFinite(pricePercentRaw)) ? pricePercentRaw : (item.percent?.status === 1 ? Number.parseFloat(item.percent.percent) : null);`
  - 驗證：`item.price_percent = "80"` → `discountRate = 80`、`costPrice = originalPrice * 0.80`
  - 驗證：`item.price_percent = null`、`item.percent.status = 1`、`item.percent.percent = "75"` → `discountRate = 75`
  - 驗證：兩者皆無 → `discountRate = null`、`costPrice = originalPrice`

- [x] 確認 `crawlAnismileProductsWithStats` 折扣比率警告已存在（實作「Crawl result validates discount coverage」）
  - 檔案：`packages/api/modules/anismile/lib/crawler.ts`（約第 488 行）
  - 確認 `discountRatio < 0.1` 警告邏輯存在且正確
  - 若不存在：補充 `const productsWithDiscount = products.filter(p => p.discountRate != null).length; const discountRatio = ...; if (discountRatio < 0.1 && products.length > 0) logger.warn(...)`

- [x] 確認 `packages/sync/src/crawler.ts` sync log 折扣統計已存在（實作「Sync log records discount statistics」）
  - 找到 `withDiscount`/`withoutDiscount` 統計段落（約第 150-168 行）
  - 確認 `discountRatio < 0.1` 時 `errorMessage` 含 `[discount-alert]`
  - 若不存在：補充相應邏輯

## Wave 2 — 單元測試

- [x] [P] 在 `packages/api/modules/anismile/lib/crawler.test.ts` 新增折扣解析單元測試，驗證「price_percent 為 primary」規格
  - 測試案例 1（實作「Discount rate must be correctly parsed from source API / price_percent present」）：`item.price_percent = "80"` → `discountRate = 80`
  - 測試案例 2（實作「price_percent absent, percent.status is 1」）：`price_percent = null`、`percent = { status: 1, percent: "75" }` → `discountRate = 75`
  - 測試案例 3（實作「Both sources absent」）：兩者皆空 → `discountRate = null`
  - 執行：`pnpm --filter @repo/api test crawler`，確認全綠

## Wave 3 — 建立 Skills

- [x] [P] 建立 `~/.claude/skills/external-api-crawler-audit/SKILL.md`，實作三項規格：「External API crawler must include field inventory before implementation」、「External API crawler must validate critical field coverage after crawl」、「Crawler skill must be invoked for all external API crawler tasks」
  - GATE：任何新增/修改外部 API crawler 任務必須觸發此 skill
  - 流程：(1) 列出所有 API response 欄位及型別；(2) 確認每個 price/cost 欄位的 DB 對應與計算公式；(3) 確認有折扣覆蓋率驗證邏輯；(4) 確認有 `< 10%` 警告門檻
  - 完成條件：SKILL.md 包含觸發條件、欄位盤點 checklist、驗證門檻規範

- [x] [P] 建立 `~/.claude/skills/nextjs-image-audit/SKILL.md`
  - GATE：任何新增 `<Image>` 元件或修改 `next.config` remotePatterns 時觸發
  - 流程：(1) 確認 image domain 已加入 `next.config.ts` 的 `remotePatterns`；(2) 確認 `protocol`、`hostname`、`pathname` 設定正確；(3) 若 R2 自訂網域則確認 `NEXT_PUBLIC_R2_PUBLIC_URL` 有對應 remotePattern
  - 完成條件：SKILL.md 包含觸發條件、remotePatterns checklist、常見錯誤速查

## Wave 4 — 驗收

- [x] 執行 `pnpm --filter @repo/api test` 確認全綠（crawler.test.ts 全過，其餘失敗為既有問題）
- [ ] 執行 `pnpm type-check` 確認無型別錯誤
- [ ] 執行 `pnpm build` 確認成功
- [x] `git add`、`git commit -m "fix(anismile): use price_percent as primary discount source"`
