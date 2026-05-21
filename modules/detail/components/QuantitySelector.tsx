"use client";

import { Button } from "@repo/ui";

type QuantitySelectorProps = {
	value: number;
	onChange: (next: number) => void;
	min?: number;
	max?: number;
};

export function QuantitySelector({ value, onChange, min = 1, max = 99 }: QuantitySelectorProps) {
	const decreaseDisabled = value <= min;
	const increaseDisabled = value >= max;

	return (
		<div className="inline-flex items-center rounded-lg border border-stone-300 bg-white">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				disabled={decreaseDisabled}
				onClick={() => onChange(Math.max(min, value - 1))}
				aria-label="減少數量"
			>
				-
			</Button>
			<span className="min-w-10 text-center text-sm font-medium text-stone-800">{value}</span>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				disabled={increaseDisabled}
				onClick={() => onChange(Math.min(max, value + 1))}
				aria-label="增加數量"
			>
				+
			</Button>
		</div>
	);
}
