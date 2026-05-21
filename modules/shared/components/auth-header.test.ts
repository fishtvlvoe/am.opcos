import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("AuthHeader contract", () => {
	it("contains avatar dropdown and cart badge", () => {
		const source = read("apps/anismile/modules/shared/components/AuthHeader.tsx");
		expect(source).toContain("DropdownMenu");
		expect(source).toContain("帳號設定");
		expect(source).toContain("登出");
		expect(source).toContain("orpc.anismile.cart.getItems");
	});

	it("authenticated layout mounts AppNav (includes cart badge + user menu)", () => {
		// layout 使用 AppNav 整合導航，AuthHeader 功能已整合於 AppNav
		const source = read("apps/anismile/app/(authenticated)/layout.tsx");
		expect(source).toContain("AppNav");
	});
});
