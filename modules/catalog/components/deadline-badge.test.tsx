import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { getDeadlineBadgeState } from "./deadline-utils";

describe("getDeadlineBadgeState", () => {
	const now = new Date("2026-05-16T00:00:00.000Z");

	it("returns pulsing text for deadlines within 3 days", () => {
		expect(getDeadlineBadgeState(new Date("2026-05-16T00:00:00.000Z"), now)).toMatchObject({
			label: "今日截止",
			pulse: true,
		});
		expect(getDeadlineBadgeState(new Date("2026-05-17T00:00:00.000Z"), now)).toMatchObject({
			label: "截止倒數 1 天",
			pulse: true,
		});
		expect(getDeadlineBadgeState(new Date("2026-05-19T00:00:00.000Z"), now)).toMatchObject({
			label: "截止倒數 3 天",
			pulse: true,
		});
	});

	it("returns static deadline text for deadlines within 7 days", () => {
		expect(getDeadlineBadgeState(new Date("2026-05-23T00:00:00.000Z"), now)).toMatchObject({
			label: "截止 5/23",
			pulse: false,
		});
	});

	it("returns null when deadline is missing", () => {
		expect(getDeadlineBadgeState(null, now)).toBeNull();
	});
});

describe("DeadlineBadge source contract", () => {
	it("uses deadline pulse class hook and red style tokens", () => {
		const source = readFileSync(
			resolve(process.cwd(), "modules/catalog/components/DeadlineBadge.tsx"),
			"utf8",
		);

		expect(source).toContain("deadline-pulse");
		expect(source).toContain("text-red-700");
		expect(source).toContain("getDeadlineBadgeState");
	});
});
