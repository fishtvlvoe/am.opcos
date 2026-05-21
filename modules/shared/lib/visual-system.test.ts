import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appLayout = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");
const globalCss = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

describe("anismile visual system", () => {
	it("uses Inter via next/font in app layout", () => {
		expect(appLayout).toContain("Inter");
		expect(appLayout).toContain("next/font/google");
	});

	it("defines mockup stone palette tokens from 25 through 950", () => {
		expect(globalCss).toContain("--color-stone-25: #FCFCFB;");
		expect(globalCss).toContain("--color-stone-50: #FAFAF9;");
		expect(globalCss).toContain("--color-stone-950: #0C0A09;");
	});

	it("defines card hover utility matching mockup behavior", () => {
		expect(globalCss).toContain(".card-hover");
		expect(globalCss).toContain("transform: translateY(-1px);");
		expect(globalCss).toContain("transition: all 0.15s ease;");
	});
});
