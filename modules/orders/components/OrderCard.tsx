"use client";

import { cn } from "@repo/ui";
import { format } from "date-fns";
import Image from "next/image";
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
	images?: string[];
};

export function OrderCard({ id, status, totalAmount, createdAt, itemCount, images = [] }: OrderCardProps) {
	const meta = statusMeta[status] ?? statusMeta.pending;
	const displayImages = images.slice(0, 3);
	const remainCount = Math.max(0, images.length - 3);
	return (
		<Link href={`/orders/${id}`} className="card-hover block rounded-xl border border-stone-200 bg-white p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-mono text-xs text-stone-500">{id}</p>
					<p className="mt-1 text-sm text-stone-600">{format(new Date(createdAt), "yyyy/MM/dd")}</p>
				</div>
				<span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", meta.className)}>{meta.label}</span>
			</div>

			<div className="mt-3 flex items-center gap-2">
				{displayImages.length > 0 ? (
					<>
						{displayImages.map((src, index) => (
							<Image
								key={`${id}-${src}-${index}`}
								src={src}
								alt=""
								width={32}
								height={32}
								className="rounded-md border border-stone-200 object-cover"
							/>
						))}
						{remainCount > 0 ? (
							<span className="rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-500">
								+{remainCount}
							</span>
						) : null}
					</>
				) : (
					<span className="text-xs text-stone-400">無商品圖片</span>
				)}
			</div>

			<div className="mt-4 flex items-center justify-between text-sm">
				<span className="text-stone-600">{itemCount} 品項</span>
				<span className="font-semibold text-stone-900">¥{totalAmount.toLocaleString()}</span>
			</div>
		</Link>
	);
}
