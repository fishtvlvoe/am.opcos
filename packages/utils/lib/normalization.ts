/**
 * 統一將商品系列名稱做標準化處理，將常見的繁簡/日中異體字與全半形符號對齊。
 * 基準行為與 crawler 的常規標準化一致。
 */
export function normalizeSeriesName(name: string): string {
	if (!name) return "";
	return name
		.replaceAll("截單", "截单")
		.replaceAll("！", "!")
		.replaceAll("（", "(")
		.replaceAll("）", ")")
		.replaceAll("　", " ")
		.replaceAll("薫", "薰")
		.replaceAll("凜", "凛")
		.replaceAll("？", "?")
		.toLowerCase()
		.trim();
}

/**
 * 產生商品系列名稱的所有可能異體字與符號排列組合。
 * 用於資料庫查詢時，相容於不同歷史寫入格式的精確匹配。
 */
export function generateSeriesVariants(s: string): string[] {
	if (!s) return [];

	const variants = new Set<string>();
	variants.add(s);

	// 互換的關鍵字對照表。未來若有新的異體字或符號問題，只需在此新增對照組即可一勞永逸解決。
	const replacements = [
		["截單", "截单"],
		["薫", "薰"],
		["凜", "凛"],
		["？", "?"],
		["！", "!"],
		["（", "("],
		["）", ")"],
	];

	const queue = [s];
	while (queue.length > 0) {
		const current = queue.shift()!;
		for (const [from, to] of replacements) {
			if (current.includes(from)) {
				const nextVal = current.replaceAll(from, to);
				if (!variants.has(nextVal)) {
					variants.add(nextVal);
					queue.push(nextVal);
				}
			}
			if (current.includes(to)) {
				const nextVal = current.replaceAll(to, from);
				if (!variants.has(nextVal)) {
					variants.add(nextVal);
					queue.push(nextVal);
				}
			}
		}
	}

	return Array.from(variants);
}
