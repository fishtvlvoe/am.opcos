"use client";

import { Button } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ProductCard } from "../../catalog/components/ProductCard";

export function DeadlineSection() {
	const deadlineQuery = useQuery(orpc.anismile.homepage.getDeadlineProducts.queryOptions({ input: {} }));
	const products = deadlineQuery.data?.products ?? [];

	if (deadlineQuery.isPending) return null;
	if (products.length === 0) return null;

	const earliestDeadline = products[0]?.orderDeadline;
	const deadlineLabel = earliestDeadline ? format(new Date(earliestDeadline), "M月d日截止") : "";

	return (
		<section className="mb-12">
			<h2 className="mb-4 text-lg font-bold text-stone-900">即將截單</h2>
			{deadlineLabel && (
				<div className="mb-4">
					<span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium tracking-[0.02em] text-red-700">
						{deadlineLabel}
					</span>
				</div>
			)}

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{products.map((product, index) => (
					<ProductCard
						key={product.id}
						id={product.id}
						title={product.title ?? "未命名商品"}
						price={product.sellingPrice}
						imageUrl={Array.isArray(product.imageUrls) ? String(product.imageUrls[0] ?? "") : ""}
						orderDeadline={product.orderDeadline}
						priority={index < 4}
					/>
				))}
			</div>

			<div className="mt-6 text-center">
				<Button variant="ghost" className="text-sm font-medium text-primary hover:text-primary/80 hover:underline">
					查看更多 »
				</Button>
			</div>
		</section>
	);
}
