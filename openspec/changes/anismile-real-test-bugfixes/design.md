## Decisions

### D1: Stripe session 失敗時不視為 checkout 成功

- API 仍保留已建立的訂單（避免資料不一致），但回傳 `paymentPending: true`。
- 前端收到 `paymentPending` 時，導回 `/checkout?orderId=<id>&payment=cancelled`，提示重試付款。
- 使用者可透過 `checkoutStripeSession` 重新取得 Stripe URL。

### D2: Public product listing 維持安全預設

- public API 不接受 `showUnavailable` 放寬庫存/截單限制。
- `listProducts`（含補抓後重查）固定 `onlyInStock: true` 與 `showUnavailable: false`。

## Test Evidence

- `pnpm test` 全部通過（46 files / 206 tests）。
- `product-sync-protection.test.ts` 針對 `onlyInStock/showUnavailable` 契約通過。
- production smoke:
  - `/` = 200
  - `/checkout/success` = 307（未登入導向，符合 authenticated guard）
  - `/api/webhooks/stripe` GET = 405 / POST(無簽名) = 400
- production e2e（2026-05-24）：
  - 新帳號註冊與登入成功。
  - 地址 CRUD 成功，checkout 可帶出「姓名/電話/地址/身份證」。
  - 初次送單觸發 `/api/rpc/anismile/cart/checkout` 回傳 400：
    - `The column order_type of relation anismile_orders does not exist in the current database.`
  - 套用 production migration 後，下單 API 回傳 200 並建立 `orderId`。
  - admin 拆單流程發現 UI 可對子訂單點拆單，觸發 `僅可拆分父訂單`；已修為僅父訂單可點拆單。
  - DB 回讀驗證：父訂單 `cmpjvkee8000104jpfr462t39` 已生成子訂單 `cmpjvm91u000504jp60uobchk`（`order_type=split`）。
  - 郵件寄達驗證尚未完成：production 未配置通知收件清單/寄信參數，需補齊後再做寄達驗證。
