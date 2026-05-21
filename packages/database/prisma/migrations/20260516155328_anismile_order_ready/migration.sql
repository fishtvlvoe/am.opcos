-- AlterTable
ALTER TABLE "anismile_orders" ADD COLUMN     "shipping_address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "shipping_name" VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN     "shipping_phone" VARCHAR(30) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "anismile_products" ADD COLUMN     "stock_quantity" INTEGER;

-- CreateIndex
CREATE INDEX "anismile_products_in_stock_stock_quantity_idx" ON "anismile_products"("in_stock", "stock_quantity");
