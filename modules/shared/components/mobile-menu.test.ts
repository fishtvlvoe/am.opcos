import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("MobileMenu", () => {
	it("contains overlay panel structure and responsive card width hooks", () => {
		const source = readFileSync(
			resolve(process.cwd(), "apps/anismile/modules/shared/components/MobileMenu.tsx"),
			"utf8",
		);

		expect(source).toContain("fixed inset-0");
		expect(source).toContain("backdrop-blur");
		expect(source).toContain("translate-y-0");
		expect(source).toContain("42vw");
	});
});
