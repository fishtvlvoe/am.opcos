"use client";

import { cn } from "@repo/ui";

type CategoryItem = {
	name: string;
	count: number;
};

type CategorySidebarProps = {
	items: CategoryItem[];
	value: string;
	onChange: (next: string) => void;
	className?: string;
};

export function CategorySidebar({ items, value, onChange, className }: CategorySidebarProps) {
	return (
		<aside className={cn("space-y-1 rounded-xl border border-stone-200 bg-white p-3", className)}>
			<button
				type="button"
				onClick={() => onChange("")}
				className={cn(
					"flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm text-stone-700 transition-colors hover:bg-stone-100",
					!value && "bg-stone-100 font-medium text-stone-900",
				)}
			>
				<span>全部分類</span>
			</button>
			{items.map((item) => (
				<button
					key={item.name}
					type="button"
					onClick={() => onChange(item.name)}
					className={cn(
						"flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm text-stone-700 transition-colors hover:bg-stone-100",
						value === item.name && "bg-stone-100 font-medium text-stone-900",
					)}
				>
					<span>{item.name}</span>
					<span className="text-xs text-stone-500">{item.count}</span>
				</button>
			))}
		</aside>
	);
}
