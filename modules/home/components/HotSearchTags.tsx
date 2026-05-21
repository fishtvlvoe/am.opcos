"use client";

import Link from "next/link";

const HOT_KEYWORDS = [
	"死亡遊戲",
	"吊飾",
	"亞克力立牌",
	"手辦",
	"徽章",
	"卡牌",
	"寫真卡",
	"毛絨玩具",
];

export function HotSearchTags() {
	return (
		<div className="py-3">
			<p className="mb-2 text-sm font-medium text-stone-600">熱門搜索</p>
			<div className="flex flex-wrap gap-2">
				{HOT_KEYWORDS.map((keyword) => (
					<Link
						key={keyword}
						href={`/search?q=${encodeURIComponent(keyword)}`}
						className="border rounded-full px-3 py-1 text-sm text-stone-700 transition-colors hover:bg-[#e9739a] hover:text-white hover:border-[#e9739a]"
					>
						{keyword}
					</Link>
				))}
			</div>
		</div>
	);
}
