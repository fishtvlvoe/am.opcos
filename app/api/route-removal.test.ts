import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Debug endpoint removal contract", () => {
	it("ensures that app/api/debug/r2-status/route.ts has been deleted", () => {
		const routePath = resolve(process.cwd(), "app/api/debug/r2-status/route.ts");
		expect(existsSync(routePath)).toBe(false);
	});
});
