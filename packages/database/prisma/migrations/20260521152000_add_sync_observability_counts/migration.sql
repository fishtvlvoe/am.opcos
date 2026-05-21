ALTER TABLE "anismile_sync_logs"
ADD COLUMN "products_skipped" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "products_failed" INTEGER NOT NULL DEFAULT 0;
