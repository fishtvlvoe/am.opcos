import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(resolve(__dirname, "route.ts"), "utf8");
const vercelSource = readFileSync(resolve(process.cwd(), "vercel.json"), "utf8");

describe("order summary cron route contract", () => {
	it("is protected by CRON_SECRET bearer auth", () => {
		expect(routeSource).toContain("CRON_SECRET");
		expect(routeSource).toContain("Unauthorized");
		expect(routeSource).toContain("sendDailyOrderSummaryEmail");
	});

	it("is scheduled in vercel crons", () => {
		expect(vercelSource).toContain("/api/cron/order-summary");
	});
});
