import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("homepage getBanners source metadata contract", () => {
	const filePath = "packages/api/modules/anismile/procedures/homepage.ts";

	it("maps source banner name, copyright, image, and link metadata", () => {
		const source = read(filePath);
		expect(source).toContain("copyright_text?: string");
		expect(source).toContain("copyright_color?: string");
		expect(source).toContain("name?: string");
		expect(source).toContain("copyrightText");
		expect(source).toContain("copyrightColor");
		expect(source).toContain("normalizeSourceLinkUrl(item.link)");
	});
});
