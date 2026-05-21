-- CreateTable
CREATE TABLE "anismile_products" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "title_original" TEXT NOT NULL,
    "title_translated" TEXT NOT NULL,
    "description_original" TEXT,
    "description_translated" TEXT,
    "image_urls" JSONB NOT NULL DEFAULT '[]',
    "category" TEXT,
    "series" TEXT,
    "original_price" DECIMAL(10,2),
    "cost_price" DECIMAL(10,2) NOT NULL,
    "markup_override" DECIMAL(5,4),
    "selling_price" DECIMAL(10,2) NOT NULL,
    "listing_date" DATE,
    "order_deadline" DATE,
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anismile_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anismile_cart_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anismile_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anismile_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anismile_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anismile_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anismile_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anismile_sync_logs" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "products_synced" INTEGER NOT NULL DEFAULT 0,
    "products_added" INTEGER NOT NULL DEFAULT 0,
    "products_updated" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,

    CONSTRAINT "anismile_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anismile_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anismile_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "anismile_products_supplier_id_key" ON "anismile_products"("supplier_id");

-- CreateIndex
CREATE INDEX "anismile_products_supplier_id_idx" ON "anismile_products"("supplier_id");

-- CreateIndex
CREATE INDEX "anismile_products_category_idx" ON "anismile_products"("category");

-- CreateIndex
CREATE INDEX "anismile_products_series_idx" ON "anismile_products"("series");

-- CreateIndex
CREATE INDEX "anismile_products_listing_date_idx" ON "anismile_products"("listing_date" DESC);

-- CreateIndex
CREATE INDEX "anismile_products_order_deadline_idx" ON "anismile_products"("order_deadline");

-- CreateIndex
CREATE UNIQUE INDEX "anismile_cart_items_user_id_product_id_key" ON "anismile_cart_items"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "anismile_orders_user_id_idx" ON "anismile_orders"("user_id");

-- CreateIndex
CREATE INDEX "anismile_orders_status_idx" ON "anismile_orders"("status");

-- CreateIndex
CREATE INDEX "anismile_order_items_order_id_idx" ON "anismile_order_items"("order_id");

-- AddForeignKey
ALTER TABLE "anismile_cart_items" ADD CONSTRAINT "anismile_cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anismile_cart_items" ADD CONSTRAINT "anismile_cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "anismile_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anismile_orders" ADD CONSTRAINT "anismile_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anismile_order_items" ADD CONSTRAINT "anismile_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "anismile_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anismile_order_items" ADD CONSTRAINT "anismile_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "anismile_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
