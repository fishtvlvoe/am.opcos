"use client";

import { cn } from "@repo/ui";
import { format } from "date-fns";
import Link from "next/link";

const statusMeta = {
	pending: { label: "待確認", className: "bg-amber-100 text-amber-700" },
	shipped: { label: "已出貨", className: "bg-blue-100 text-blue-700" },
	completed: { label: "已完成", className: "bg-green-100 text-green-700" },
	cancelled: { label: "已取消", className: "bg-red-100 text-red-700" },
	confirmed: { label: "已確認", className: "bg-stone-200 text-stone-700" },
} as const;

type OrderCardProps = {
	id: string;
	status: keyof typeof statusMeta;
	totalAmount: number;
	createdAt: Date | string;
	itemCount: number;
};

export function OrderCard({ id, status, totalAmount, createdAt, itemCount }: OrderCardProps) {
	const meta = statusMeta[status] ?? statusMeta.pending;
	return (
		<Link href={`/orders/${id}`} className="card-hover block rounded-xl border border-stone-200 bg-white p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-mono text-xs text-stone-500">{id}</p>
					<p className="mt-1 text-sm text-stone-600">{format(new Date(createdAt), "yyyy/MM/dd")}</p>
				</div>
				<span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", meta.className)}>{meta.label}</span>
			</div>

			<div className="mt-4 flex items-center justify-between text-sm">
				<span className="text-stone-600">{itemCount} 品項</span>
				<span className="font-semibold text-stone-900">¥{totalAmount.toLocaleString()}</span>
			</div>
		</Link>
	);
}
