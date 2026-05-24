import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "modules/account/AccountSettingsPage.tsx"), "utf8");

describe("AccountSettingsPage", () => {
	it("lets users maintain default shipping identity fields from account settings", () => {
		expect(source).toContain("常用收件資料");
		expect(source).toContain("姓名");
		expect(source).toContain("電話");
		expect(source).toContain("地址");
		expect(source).toContain("身份證字號");
	});

	it("persists the quick shipping profile through address CRUD APIs", () => {
		expect(source).toContain("orpc.anismile.addresses.list.queryOptions");
		expect(source).toContain("orpc.anismile.addresses.create.mutationOptions");
		expect(source).toContain("orpc.anismile.addresses.update.mutationOptions");
		expect(source).toContain("orpc.anismile.addresses.setDefault.mutationOptions");
		expect(source).toContain("defaultAddress");
	});
});
