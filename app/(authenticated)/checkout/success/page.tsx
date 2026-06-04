"use client";

import { Button } from "@repo/ui";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutSuccessPage() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get("orderId");

	return (
		<div className="mx-auto max-w-xl space-y-4 py-12">
			<h1 className="text-2xl font-semibold">付款完成</h1>
			<p className="text-sm text-stone-600">
				系統已收到您的付款，訂單狀態會在幾秒內更新為已確認。
			</p>
			{orderId ? (
				<p className="rounded-lg border border-stone-200 bg-white p-3 font-mono text-sm">
					訂單編號：{orderId}
				</p>
			) : null}
			<div className="flex gap-2">
				<Button asChild>
					<Link href={orderId ? `/orders/${orderId}` : "/orders"}>查看訂單</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/">繼續採購</Link>
				</Button>
			</div>
		</div>
	);
}
