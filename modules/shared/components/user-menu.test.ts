import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("UserMenu role-separated account navigation", () => {
	const filePath = "modules/shared/components/UserMenu.tsx";

	it("將客戶帳號功能與管理員後台功能分成不同區塊", () => {
		const source = read(filePath);

		expect(source).toContain("我的帳戶");
		expect(source).toContain("我的訂單");
		expect(source).toContain("收藏夾");
		expect(source).toContain("商品池");
		expect(source).toContain("導入訂單");
		expect(source).toContain("會員等級");
		expect(source).toContain("帳號設定");
		expect(source).toContain("管理員");
		expect(source).toContain('user.role === "admin" || user.role === "super_admin"');
	});

	it("管理員區塊包含後台細項入口", () => {
		const source = read(filePath);

		expect(source).toContain('href="/admin/orders"');
		expect(source).toContain('href="/admin/customers"');
		expect(source).toContain('href="/admin/products"');
		expect(source).toContain('href="/admin/sync"');
		expect(source).toContain('href="/admin/settings"');
	});
});
