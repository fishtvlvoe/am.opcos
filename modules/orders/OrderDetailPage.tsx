"use client";

import { useSession } from "@auth/hooks/use-session";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
	pending: "待確認",
	confirmed: "已確認",
	shipped: "已出貨",
	completed: "已完成",
	cancelled: "已取消",
};

export function OrderDetailPage({ id, isConfirmation = false }: { id: string; isConfirmation?: boolean }) {
	const { user } = useSession();
	const isAdmin = user?.role === "admin" || user?.role === "super_admin";
	const orderQuery = useQuery(
		orpc.anismile.orders.getById.queryOptions({
			input: { id },
		}),
	);

	const order = orderQuery.data;
	if (!order) {
		return <p className="text-muted-foreground">載入中...</p>;
	}

	return (
		<div className="space-y-4">
			{isConfirmation && (
				<Card className="border-primary/30 bg-primary/5">
					<CardContent className="p-4 text-sm">
						<p className="font-medium">訂單送出後，管理員會確認並通知您。</p>
						<p className="mt-1 text-muted-foreground">價格以下單時為準。</p>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="text-xl">訂單 {order.id}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					<p>
						狀態：<Badge status="info">{statusLabels[order.status] ?? order.status}</Badge>
					</p>
					<p>建立時間：{format(new Date(order.createdAt), "yyyy-MM-dd HH:mm")}</p>
					<p>訂單總額：¥ {Number(order.totalAmount).toFixed(2)}</p>
					{order.notes && <p>備註：{order.notes}</p>}
				</CardContent>
			</Card>

			{order.shippingName && (
				<Card>
					<CardHeader>
						<CardTitle>配送資訊</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1 text-sm">
						<p>收件人：{order.shippingName}</p>
						<p>聯絡電話：{order.shippingPhone}</p>
						<p>配送地址：{order.shippingAddress}</p>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>品項明細</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{order.items.map((item) => (
						<div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
							<div>
								<p className="font-medium">{item.product.titleTranslated || item.product.titleOriginal}</p>
								<p className="text-sm text-muted-foreground">數量 {item.quantity}</p>
							</div>
							<div className="text-right text-sm">
								<p>售價 ¥ {Number(item.unitPrice).toFixed(2)}</p>
								{isAdmin && item.costPrice && <p>成本 ¥ {Number(item.costPrice).toFixed(2)}</p>}
								{isAdmin && item.profit && <p>毛利 ¥ {Number(item.profit).toFixed(2)}</p>}
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
