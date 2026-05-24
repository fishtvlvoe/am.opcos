## Why

真實測試（production smoke + full test suite）發現 commerce enhancement 相關流程有高風險缺陷，會影響訂單可用性與公開商品防護：

1. NORMAL 客戶建單後若 Stripe session 建立失敗，UI 會被當成一般建單成功導去 confirmation，造成未付款訂單混入正常流程。
2. 公開商品 API 的 `onlyInStock/showUnavailable` 契約被放寬，與既有 sync-protection 安全預期衝突。
3. production DB 尚未套用 `anismile_commerce_enhancement` migration，`/api/rpc/anismile/cart/checkout` 直接 400（缺 `order_type` 欄位），導致下單/付款/拆單/通知全鏈路阻塞。

## What Changes

- 修正 checkout fallback：Stripe session 失敗時回傳 `paymentPending`，前端導回 checkout 並啟用「重新付款」流程，不再走 confirmation 成功路徑。
- 維持公開商品 API 防護契約：public list flow 強制 `onlyInStock: true` 與 `showUnavailable: false`。
- 補上 production migration 套用步驟與驗證，確保 `anismile_orders` 新欄位存在並可成功建單。
- 補充回歸測試與驗證紀錄。

## Impact

- Affected code:
  - `modules/checkout/CheckoutPage.tsx`
  - `packages/api/modules/anismile/procedures/cart.ts`
  - `packages/api/modules/anismile/procedures/products.ts`
- Affected tests:
  - `packages/api/modules/anismile/procedures/product-sync-protection.test.ts`
  - `packages/api/modules/anismile/procedures/cart-contract.test.ts`
