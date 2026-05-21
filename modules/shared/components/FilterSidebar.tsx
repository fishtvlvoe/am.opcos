"use client";

import { cn } from "@repo/ui";
import { CheckIcon } from "lucide-react";

type FacetItem = { name: string; count: number };
type FacetGroup = { label: string; key: string; items: FacetItem[] };

export type QuickFilter = { key: string; label: string; checked: boolean };

type FilterSidebarProps = {
	groups: FacetGroup[];
	selected: Record<string, string | undefined>;
	onChange: (key: string, value: string | undefined) => void;
	quickFilters?: QuickFilter[];
	onQuickFilterChange?: (key: string, checked: boolean) => void;
};

export function FilterSidebar({ groups, selected, onChange, quickFilters, onQuickFilterChange }: FilterSidebarProps) {
	return (
		<aside className="space-y-6">
			{quickFilters && quickFilters.length > 0 && (
				<div>
					<h3 className="mb-2 text-sm font-semibold">快速篩選</h3>
					<div className="space-y-1">
						{quickFilters.map((qf) => (
							<label key={qf.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent">
								<input
									type="checkbox"
									checked={qf.checked}
									onChange={(e) => onQuickFilterChange?.(qf.key, e.target.checked)}
									className="accent-primary"
								/>
								<span>{qf.label}</span>
							</label>
						))}
					</div>
				</div>
			)}
			{groups.map((group) => (
				<div key={group.key}>
					<h3 className="mb-2 text-sm font-semibold">{group.label}</h3>
					<div className="space-y-1">
						{group.items.map((item) => {
							const isSelected = selected[group.key] === item.name;
							return (
								<button
									key={item.name}
									type="button"
									onClick={() => onChange(group.key, isSelected ? undefined : item.name)}
									className={cn(
										"flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
										isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent",
									)}
								>
									<span className="flex items-center gap-2">
										{isSelected && <CheckIcon className="size-3.5" />}
										<span>{item.name}</span>
									</span>
									<span className="text-xs text-muted-foreground">{item.count}</span>
								</button>
							);
						})}
					</div>
				</div>
			))}
		</aside>
	);
}
