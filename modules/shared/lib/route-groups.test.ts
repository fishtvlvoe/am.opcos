import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("public route group", () => {
	it("has a public layout with PublicHeader (B2B 不需要公開首頁)", () => {
		// (public)/page.tsx 不存在 — B2B 平台無需公開首頁，直接導向登入
		expect(existsSync(resolve(process.cwd(), "apps/anismile/app/(public)/layout.tsx"))).toBe(true);

		const layout = read("apps/anismile/app/(public)/layout.tsx");
		expect(layout).toContain("PublicHeader");
		expect(layout).not.toContain("redirect(");
	});
});

describe("auth route group", () => {
	it("anismile 無本地 auth 路由，登入由母站 (NEXT_PUBLIC_OPCOS_URL) 處理", () => {
		// (auth) 目錄不存在 — auth 路由已移除，改由 opcOS 母站統一處理
		expect(existsSync(resolve(process.cwd(), "apps/anismile/app/(auth)"))).toBe(false);
		expect(existsSync(resolve(process.cwd(), "apps/anismile/app/(unauthenticated)"))).toBe(false);
	});
});
