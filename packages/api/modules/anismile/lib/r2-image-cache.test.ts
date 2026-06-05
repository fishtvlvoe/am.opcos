import { describe, expect, it } from "vitest";

import { getR2Key } from "./r2-image-cache";

describe("getR2Key", () => {
	it("日文系列名稱產生不同的 key", () => {
		const keyKimetsu = getR2Key("鬼滅の刃");
		const keyOnePiece = getR2Key("ワンピース");
		expect(keyKimetsu).not.toEqual(keyOnePiece);
	});

	it("不等於空 key（舊 slug 碰撞問題）", () => {
		expect(getR2Key("鬼滅の刃")).not.toEqual("series/.jpg");
		expect(getR2Key("ワンピース")).not.toEqual("series/.jpg");
	});

	it("格式符合 series/<16 hex chars>.jpg", () => {
		const key = getR2Key("鬼滅の刃");
		expect(key).toMatch(/^series\/[0-9a-f]{16}\.jpg$/);
	});

	it("相同輸入產生相同 key（deterministic）", () => {
		expect(getR2Key("鬼滅の刃")).toEqual(getR2Key("鬼滅の刃"));
	});

	it("前後空白不影響 key（trim）", () => {
		expect(getR2Key("  鬼滅の刃  ")).toEqual(getR2Key("鬼滅の刃"));
	});
});
