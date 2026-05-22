import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("FranchiseBanner", () => {
	const filePath = "modules/home/components/FranchiseBanner.tsx";

	it("每組最多顯示三個 source banner 並維持 200px 高度", () => {
		const source = read(filePath);
		expect(source).toContain("groupIndex * 3");
		expect(source).toContain("groupIndex * 3 + 3");
		expect(source).toContain("h-[200px]");
	});

	it("每個 source banner 使用 href 並顯示 copyright overlay", () => {
		const source = read(filePath);
		expect(source).toContain("item.href");
		expect(source).toContain("item.copyrightText");
		expect(source).toContain("item.copyrightColor");
		expect(source).toContain("alt={item.name}");
		expect(source).not.toContain("`/series/${encodeURIComponent(item.category)}`");
		expect(source).not.toContain("/categories/");
	});
});
