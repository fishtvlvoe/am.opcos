import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("FranchiseBanner", () => {
	const filePath = "modules/home/components/FranchiseBanner.tsx";

	it("每組最多顯示三個 franchise 並維持 200px 高度", () => {
		const source = read(filePath);
		expect(source).toContain("groupIndex * 3");
		expect(source).toContain("groupIndex * 3 + 3");
		expect(source).toContain("h-[200px]");
	});

	it("每個 franchise 連到 /series/{category}", () => {
		const source = read(filePath);
		expect(source).toContain("`/series/${encodeURIComponent(item.category)}`");
		expect(source).not.toContain("/categories/");
	});
});
