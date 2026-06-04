import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AdminSettingsPage backsolve pricing copy", () => {
	it("uses 預設回推百分比 copy instead of 預設利潤率", () => {
		const source = readFileSync(resolve(process.cwd(), "modules/admin/AdminSettingsPage.tsx"), "utf8");

		expect(source).toContain("預設回推百分比");
		expect(source).toContain("來源 8 折變客戶 9 折");
	});
});
