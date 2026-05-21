"use client";

import { cn } from "@repo/ui";

type DateChipFilterProps = {
	options: string[];
	value: string;
	onChange: (next: string) => void;
};

export function DateChipFilter({ options, value, onChange }: DateChipFilterProps) {
	return (
		<div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
			<button
				type="button"
				onClick={() => onChange("")}
				className={cn(
					"rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-600 transition-colors hover:bg-stone-900 hover:text-white",
					!value && "border-stone-900 bg-stone-900 text-white",
				)}
			>
				全部
			</button>
			{options.map((option) => (
				<button
					key={option}
					type="button"
					onClick={() => onChange(option)}
					className={cn(
						"rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-600 transition-colors hover:bg-stone-900 hover:text-white",
						value === option && "border-stone-900 bg-stone-900 text-white",
					)}
				>
					{option}
				</button>
			))}
		</div>
	);
}
