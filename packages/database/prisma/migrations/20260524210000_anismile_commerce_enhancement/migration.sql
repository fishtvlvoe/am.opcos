ALTER TABLE "anismile_orders"
  ADD COLUMN "parent_id" TEXT,
  ADD COLUMN "order_type" TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN "split_suffix" INTEGER,
  ADD COLUMN "payment_method" TEXT NOT NULL DEFAULT 'bank_transfer',
  ADD COLUMN "payment_status" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "stripe_session_id" TEXT;

ALTER TABLE "anismile_orders"
  ADD CONSTRAINT "anismile_orders_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "anismile_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_anismile_orders_parent_id" ON "anismile_orders"("parent_id");
CREATE INDEX "idx_anismile_orders_payment_status" ON "anismile_orders"("payment_status");

ALTER TABLE "anismile_order_items"
  ADD COLUMN "allocated_qty" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "shipped_qty" INTEGER NOT NULL DEFAULT 0;
