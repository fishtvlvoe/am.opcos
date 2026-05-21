import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(appPath(relativePath), "utf8");
}

function appPath(relativePath: string) {
	const direct = resolve(process.cwd(), relativePath);
	if (existsSync(direct)) return direct;
	return resolve(process.cwd(), "apps/anismile", relativePath);
}

describe("public route group", () => {
	it("has public browsing routes with PublicHeader", () => {
		expect(existsSync(appPath("app/(public)/layout.tsx"))).toBe(true);
		expect(existsSync(appPath("app/(public)/page.tsx"))).toBe(true);
		expect(existsSync(appPath("app/(public)/products/[id]/page.tsx"))).toBe(true);
		expect(existsSync(appPath("app/(public)/categories/[slug]/page.tsx"))).toBe(true);
		expect(existsSync(appPath("app/(public)/series/[id]/page.tsx"))).toBe(true);
		expect(existsSync(appPath("app/(public)/search/page.tsx"))).toBe(true);

		const layout = read("app/(public)/layout.tsx");
		expect(layout).toContain("PublicHeader");
		expect(layout).not.toContain("redirect(");
	});
});

describe("auth route group", () => {
	it("anismile 無本地 auth 路由，登入由母站 (NEXT_PUBLIC_OPCOS_URL) 處理", () => {
		// (auth) 目錄不存在 — auth 路由已移除，改由 opcOS 母站統一處理
		expect(existsSync(appPath("app/(auth)"))).toBe(false);
		expect(existsSync(appPath("app/(unauthenticated)"))).toBe(false);
	});
});
