import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("batched sync contract", () => {
	it("runs anismile sync with cursor, batch size, and bounded delay", () => {
		const syncSource = readFileSync(join(process.cwd(), "packages/sync/src/crawler.ts"), "utf8");
		const crawlerSource = readFileSync(
			join(process.cwd(), "packages/api/modules/anismile/lib/crawler.ts"),
			"utf8",
		);
		const querySource = readFileSync(
			join(process.cwd(), "packages/database/prisma/queries/anismile.ts"),
			"utf8",
		);

		expect(syncSource).toContain("getSyncCursor");
		expect(syncSource).toContain("setSyncCursor");
		expect(syncSource).toContain("ANISMILE_SYNC_BATCH_SIZE");
		expect(syncSource).toContain("ANISMILE_SYNC_DELAY_MS");
		expect(syncSource).toContain("ANISMILE_SYNC_CONCURRENCY");
		expect(syncSource).toContain("ANISMILE_SYNC_TRANSACTION_TIMEOUT_MS");
		expect(syncSource).toContain("markMissingOutOfStock: false");
		expect(syncSource).toContain("transactionTimeoutMs");
		expect(syncSource).toContain("Math.min(parsePositiveInteger(process.env.ANISMILE_SYNC_BATCH_SIZE, 250), 500)");
		expect(crawlerSource).toContain("offset = 0");
		expect(crawlerSource).toContain("limit");
		expect(crawlerSource).toContain("concurrency = 1");
		expect(crawlerSource).toContain('source = "sitemap"');
		expect(crawlerSource).toContain("getSitemapProductEntries");
		expect(crawlerSource).toContain("allProductEntries.slice(safeOffset, safeOffset + safeLimit)");
		expect(querySource).toContain("markMissingOutOfStock = true");
		expect(querySource).toContain("timeout: transactionTimeoutMs");
		expect(querySource).toContain("const SYNC_CURSOR_KEY = \"sync.cursor\"");
	});
});
