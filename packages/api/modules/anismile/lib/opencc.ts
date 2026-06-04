type OpenccModule = {
	Converter?: (options: { from: string; to: string }) => (text: string) => string;
};

let converter: ((text: string) => string) | null = null;
let initPromise: Promise<void> | null = null;

async function initConverter() {
	try {
		const opencc = (await import("opencc-js")) as OpenccModule;
		if (typeof opencc.Converter === "function") {
			converter = opencc.Converter({ from: "cn", to: "tw" });
		}
	} catch {
		converter = null;
	}
}

// Kick off initialization immediately at module load
initPromise = initConverter();

export async function ensureConverterReady() {
	if (initPromise) {
		await initPromise;
		initPromise = null;
	}
}

export function toTraditionalChinese(text: string | null | undefined) {
	if (!text) {
		return text ?? "";
	}

	if (!converter) {
		return text;
	}

	return converter(text);
}
