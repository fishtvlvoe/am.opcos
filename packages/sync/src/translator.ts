// 簡體 → 繁體翻譯，使用 opencc-js（與 @repo/api 同版本）
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let converter: ((text: string) => string) | null = null;

function ensureConverter() {
	if (converter) return converter;

	try {
		const opencc = require("opencc-js") as {
			Converter?: (options: { from: string; to: string }) => (text: string) => string;
		};
		if (typeof opencc.Converter === "function") {
			converter = opencc.Converter({ from: "cn", to: "tw" });
		}
	} catch {
		converter = null;
	}

	return converter;
}

/**
 * 將簡體中文轉換為繁體中文
 * opencc-js 初始化失敗或輸入空字串時，原文回傳
 */
export function translateToTraditional(text: string): string {
	if (!text) return text;
	try {
		const activeConverter = ensureConverter();
		return activeConverter ? activeConverter(text) : text;
	} catch {
		return text;
	}
}
