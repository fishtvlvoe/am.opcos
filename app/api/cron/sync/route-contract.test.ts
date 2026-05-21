import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("cron sync route contract", () => {
	it("clears stale running sync logs before duplicate protection", () => {
		const source = readFileSync(join(process.cwd(), "app/api/cron/sync/route.ts"), "utf8");

		expect(source).toContain("STALE_RUNNING_SYNC_MS");
		expect(source).toContain("updateMany");
		expect(source).toContain("Sync timed out or was interrupted before completion");
		expect(source.indexOf("updateMany")).toBeLessThan(source.indexOf("findFirst"));
	});
});
