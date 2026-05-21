import { createSyncLog, finishSyncLog, upsertProductsFromSync } from "@repo/database";
import cron from "node-cron";

import { crawlAnismileProducts } from "@repo/api/modules/anismile/lib/crawler";

let initialized = false;

export function initAnismileCron() {
	if (initialized) {
		return;
	}
	initialized = true;

	cron.schedule("0 19 * * *", async () => {
		const syncLog = await createSyncLog();

		try {
			const products = await crawlAnismileProducts();
			const result = await upsertProductsFromSync(
				products.map((item) => ({
					supplierId: item.supplierId,
					titleOriginal: item.titleOriginal,
					titleTranslated: item.titleTranslated,
					descriptionOriginal: item.descriptionOriginal,
					descriptionTranslated: item.descriptionTranslated,
					imageUrls: item.imageUrls,
					category: item.category,
					series: item.series,
					originalPrice: item.originalPrice,
					costPrice: item.costPrice,
					orderDeadline: item.orderDeadline,
					lastSyncedAt: new Date(),
				})),
			);

			await finishSyncLog({
				id: syncLog.id,
				status: "completed",
				productsSynced: result.productsSynced,
				productsAdded: result.productsAdded,
				productsUpdated: result.productsUpdated,
			});
		} catch (error) {
			console.error("[anismile] cron sync failed", error);
			await finishSyncLog({
				id: syncLog.id,
				status: "failed",
				productsSynced: 0,
				productsAdded: 0,
				productsUpdated: 0,
				errorMessage: error instanceof Error ? error.message : "Unknown error",
			});
		}
	});
}
