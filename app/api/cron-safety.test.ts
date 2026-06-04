import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("cron safety contract", () => {
	it("does not initialize the legacy node-cron scheduler from the REST route entrypoint", () => {
		const routeSource = read("app/api/[[...rest]]/route.ts");

		expect(routeSource).not.toContain("initAnismileCron");
		expect(routeSource).not.toContain("node-cron");
	});

	it("keeps the legacy cron shim as a no-op so stale imports cannot revive destructive partial syncs", () => {
		const cronSource = read("app/api/cron.ts");

		expect(cronSource).toContain("Legacy no-op");
		expect(cronSource).not.toContain("cron.schedule(");
		expect(cronSource).not.toContain("limit: 250");
	});
});
