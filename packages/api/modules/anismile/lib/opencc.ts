import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let converter: ((text: string) => string) | null = null;

function ensureConverter() {
	if (converter) {
		return converter;
	}

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

export function toTraditionalChinese(text: string | null | undefined) {
	if (!text) {
		return text ?? "";
	}

	const activeConverter = ensureConverter();
	if (!activeConverter) {
		return text;
	}

	return activeConverter(text);
}
