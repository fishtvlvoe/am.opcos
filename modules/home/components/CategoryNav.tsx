"use client";

import { cn } from "@repo/ui";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

const categoryTabs = [
	{
		label: "周邊收藏",
		subs: ["徽章", "亞克力立牌", "亞克力磚塊", "鑰匙扣", "掛飾", "寫真卡", "色紙", "貼紙"],
	},
	{
		label: "手辦・卡牌",
		subs: ["手辦", "毛絨玩具", "卡牌周邊"],
	},
	{
		label: "裝飾・服飾",
		subs: ["海報", "掛毯", "服裝", "包", "錢包"],
	},
	{
		label: "生活雜貨",
		subs: ["文具", "日用品", "收納", "化妝品"],
	},
	{ label: "全部系列", subs: [], href: "/search" },
];

export function CategoryNav() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);
	const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

	const getDropdownPosition = () => {
		if (openIndex === null) return {};
		const btn = buttonRefs.current[openIndex];
		if (!btn) return {};
		const rect = btn.getBoundingClientRect();
		const parentRect = btn.closest("[data-category-nav]")?.getBoundingClientRect();
		if (!parentRect) return {};
		return { left: rect.left - parentRect.left };
	};

	const dropdownPos = getDropdownPosition();
	const activeSubs = openIndex !== null ? categoryTabs[openIndex]?.subs ?? [] : [];

	return (
		<div className="border-b border-stone-200 bg-white">
			<div className="container">
				<div className="relative" data-category-nav>
					<div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
						{categoryTabs.map((cat, idx) => {
							const className = cn(
								"inline-flex flex-shrink-0 items-center gap-1 rounded-lg px-5 py-2.5 text-[13.5px] font-medium transition-colors text-white",
								openIndex === idx
									? "bg-[#d6628a]"
									: "bg-[#e9739a] hover:bg-[#d6628a]",
							);

							if (cat.href) {
								return (
									<Link key={cat.label} href={cat.href} className={className}>
										{cat.label}
									</Link>
								);
							}

							return (
								<button
									key={cat.label}
									type="button"
									ref={(el) => { buttonRefs.current[idx] = el; }}
									onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
									className={className}
								>
									{cat.label}
									{cat.subs.length > 0 && (
										<ChevronDownIcon
											className={cn("size-3.5 transition-transform", openIndex === idx && "rotate-180")}
										/>
									)}
								</button>
							);
						})}
					</div>

					{openIndex !== null && activeSubs.length > 0 && (
						<div
							className="absolute z-50 mt-0 min-w-[160px] rounded-lg border border-stone-200 bg-white py-1.5 shadow-lg"
							style={{ left: dropdownPos.left ?? 0 }}
						>
							{activeSubs.map((sub) => (
								<Link
									key={sub}
									href={"/categories/" + sub}
									onClick={() => setOpenIndex(null)}
									className="block w-full px-4 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50"
								>
									{sub}
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
