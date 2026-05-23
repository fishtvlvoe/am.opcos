ALTER TABLE "anismile_orders"
ADD COLUMN "confirmed_at" TIMESTAMP(3),
ADD COLUMN "confirmed_by_id" TEXT,
ADD COLUMN "supplier_forwarded_at" TIMESTAMP(3),
ADD COLUMN "supplier_forwarded_by_id" TEXT,
ADD COLUMN "supplier_forwarding_error" TEXT;

CREATE INDEX "anismile_orders_supplier_forwarded_at_idx" ON "anismile_orders"("supplier_forwarded_at");
