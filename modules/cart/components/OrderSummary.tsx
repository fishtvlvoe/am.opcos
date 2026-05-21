"use client";

import { Button } from "@repo/ui";

type OrderSummaryProps = {
	itemCount: number;
	subtotal: number;
	onSubmit: () => void;
	disabled: boolean;
};

export function OrderSummary({ itemCount, subtotal, onSubmit, disabled }: OrderSummaryProps) {
	return (
		<section className="h-fit space-y-4 rounded-xl border border-stone-200 bg-white p-4">
			<h2 className="font-semibold text-lg text-stone-900">訂單摘要</h2>
			<div className="space-y-2 text-sm">
				<div className="flex items-center justify-between">
					<span className="text-stone-600">品項數</span>
					<span className="font-medium text-stone-900">{itemCount}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-stone-600">小計</span>
					<span className="font-medium text-stone-900">¥ {subtotal.toFixed(2)}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-stone-600">運費</span>
					<span className="text-stone-600">運費另計</span>
				</div>
				<div className="flex items-center justify-between border-t border-stone-200 pt-2">
					<span className="font-medium text-stone-700">合計</span>
					<span className="font-semibold text-stone-900">¥ {subtotal.toFixed(2)}</span>
				</div>
			</div>

			<Button className="w-full" disabled={disabled} onClick={onSubmit}>
				前往結帳
			</Button>
		</section>
	);
}
