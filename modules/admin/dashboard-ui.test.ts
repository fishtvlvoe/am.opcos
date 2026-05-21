import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Admin dashboard UI contract", () => {
	it("renders KPI stat cards and sync failure indicator", () => {
		const source = read("modules/admin/DashboardPage.tsx");
		expect(source).toContain("StatsTile");
		expect(source).toContain("待處理訂單");
		expect(source).toContain("本月營收");
		expect(source).toContain("商品總數");
		expect(source).toContain("上次同步");
		expect(source).toContain("syncStatus");
	});

	it("renders order table with profit and status updates", () => {
		const source = read("modules/admin/components/OrderTable.tsx");
		expect(source).toContain("利潤");
		expect(source).toContain("rowProfit");
		expect(source).toContain("onUpdateStatus");
	});

	it("supports csv export and manual sync trigger actions", () => {
		const source = read("modules/admin/DashboardPage.tsx");
		expect(source).toContain("downloadCsv");
		expect(source).toContain("orpc.anismile.sync.mutationOptions");
	});

	it("protects the admin dashboard route with an admin role guard", () => {
		const source = read("app/(authenticated)/admin/page.tsx");
		expect(source).toContain("getSession");
		expect(source).toContain('session.user.role !== "admin"');
		expect(source).toContain('session.user.role !== "super_admin"');
		expect(source).toContain('redirect("/")');
	});
});
