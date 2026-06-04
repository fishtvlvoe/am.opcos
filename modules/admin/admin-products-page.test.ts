import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("AdminProductsPage UI contract", () => {
	it("admin products page thumbnail — component uses next/image for thumbnail with width 40 and height 40", () => {
		const source = read("modules/admin/AdminProductsPage.tsx");
		// 預期引入了 next/image
		expect(source).toContain('import { SafeImage } from "../shared/components/SafeImage"');
		// 預期使用了 <SafeImage width={40} height={40}
		expect(source).toContain("<SafeImage width={40} height={40}");
	});
});
