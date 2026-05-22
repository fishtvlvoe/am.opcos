"use client";

import { Button } from "@repo/ui";
import { Trash2 } from "lucide-react";
import Image from "next/image";

type CartItemProps = {
	id: string;
	title: string;
	category?: string | null;
	series?: string | null;
	imageUrl?: string;
	quantity: number;
	lineTotal: number;
	unavailableReason?: string | null;
	onIncrement: (itemId: string, nextQuantity: number) => void;
	onDecrement: (itemId: string, nextQuantity: number) => void;
	onRemove: (itemId: string) => void;
	disabled?: boolean;
};

export function CartItem({
	id,
	title,
	category,
	series,
	imageUrl,
	quantity,
	lineTotal,
	unavailableReason,
	onIncrement,
	onDecrement,
	onRemove,
	disabled = false,
}: CartItemProps) {
	return (
		<div className="rounded-xl border border-stone-200 bg-white p-4">
			<div className="flex gap-4">
				<div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
					{imageUrl ? <Image src={imageUrl} alt={title} fill sizes="80px" className="object-cover" /> : null}
				</div>

				<div className="min-w-0 flex-1 space-y-2">
					<p className="line-clamp-2 text-sm text-stone-900">{title}</p>
					<div className="flex gap-2 text-xs text-stone-500">
						{category ? <span>{category}</span> : null}
						{series ? <span>{series}</span> : null}
					</div>
					{unavailableReason ? (
						<p className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
							{unavailableReason}
						</p>
					) : null}
					<div className="flex items-center justify-between">
						<div className="inline-flex items-center rounded-lg border border-stone-300">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={disabled || Boolean(unavailableReason) || quantity <= 1}
								onClick={() => onDecrement(id, quantity - 1)}
								aria-label="減少數量"
							>
								-
							</Button>
							<span className="min-w-10 text-center text-sm">{quantity}</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={disabled || Boolean(unavailableReason)}
								onClick={() => onIncrement(id, quantity + 1)}
								aria-label="增加數量"
							>
								+
							</Button>
						</div>

						<div className="text-right">
							<p className="text-xs text-stone-500">小計</p>
							<p className="font-semibold text-sm text-stone-900">¥ {lineTotal.toFixed(2)}</p>
						</div>
					</div>
				</div>
			</div>
			<div className="mt-3 flex justify-end">
				<Button type="button" variant="destructive" disabled={disabled} onClick={() => onRemove(id)}>
					<Trash2 className="mr-1.5 size-4" />
					刪除
				</Button>
			</div>
		</div>
	);
}
