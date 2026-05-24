# Tasks

- [x] 修正 Stripe checkout session 失敗 fallback，不再進 confirmation 成功路徑
- [x] Checkout UI 加入 paymentPending 導流與重試付款引導
- [x] 修正 public product API 的 `onlyInStock/showUnavailable` 契約回歸
- [x] 跑 `pnpm type-check`
- [x] 跑 `pnpm test`
- [x] production smoke 驗證 root / checkout success / webhook route
- [x] production 真實流程驗證（註冊、地址 CRUD、身份證帶入 checkout、加車）
- [x] 產出 checkout 失敗根因證據：`/api/rpc/anismile/cart/checkout` 400 + `order_type` 欄位缺失
- [x] production 套用 migration `20260524210000_anismile_commerce_enhancement`
- [x] 停用信用卡付款流程，checkout 一律走人工付款審核
- [x] 修正 admin 拆單誤操作（子訂單仍可點拆單）造成 `僅可拆分父訂單`
- [x] 套用 migration 後重跑全流程（註冊、下單、拆單）並完成 DB 回讀驗證
- [ ] production 郵件通知（寄達）實測驗證：待補齊通知收件與寄信設定
