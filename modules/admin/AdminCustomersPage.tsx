"use client";

import { useSession } from "@auth/hooks/use-session";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

const TIER_CONFIG = {
	NORMAL: { label: "普通用戶", badgeClass: "bg-stone-100 text-stone-600" },
	WHOLESALE: { label: "批發用戶", badgeClass: "bg-blue-50 text-blue-700" },
	VIP: { label: "VIP 會員", badgeClass: "bg-amber-50 text-amber-700" },
} as const;

type TierKey = keyof typeof TIER_CONFIG;

export function AdminCustomersPage() {
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [page, setPage] = useState(1);
	const { user } = useSession();
	const queryClient = useQueryClient();

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const { data, isLoading } = useQuery(
		orpc.anismile.admin.customers.queryOptions({
			input: { search: debouncedSearch, page, pageSize: PAGE_SIZE },
		}),
	);

	const tierMutation = useMutation(
		orpc.anismile.memberTier.adminUpdateTier.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: orpc.anismile.admin.customers.key(),
				});
			},
		}),
	);

	const customers = data?.customers ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const isSuperAdmin = user?.role === "super_admin";

	const tierOptions: TierKey[] = isSuperAdmin
		? ["NORMAL", "WHOLESALE", "VIP"]
		: ["NORMAL", "WHOLESALE"];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">客戶列表</h1>
				<span className="text-sm text-stone-500">共 {total} 位客戶</span>
			</div>

			<input
				type="text"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder="搜尋姓名或 Email..."
				className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
			/>

			{isLoading ? (
				<div className="py-10 text-center text-sm text-stone-500">載入中...</div>
			) : customers.length === 0 ? (
				<div className="py-10 text-center text-sm text-stone-500">尚無客戶資料</div>
			) : (
				<div className="overflow-x-auto rounded border border-stone-200">
					<table className="w-full text-sm">
						<thead className="bg-stone-50 text-stone-600">
							<tr>
								<th className="px-4 py-3 text-left font-medium">姓名</th>
								<th className="px-4 py-3 text-left font-medium">Email</th>
								<th className="px-4 py-3 text-left font-medium">等級</th>
								<th className="px-4 py-3 text-right font-medium">訂單數</th>
								<th className="px-4 py-3 text-right font-medium">最近下單</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-stone-100">
							{customers.map((customer) => {
								const tier = (customer.tier ?? "NORMAL") as TierKey;
								const config = TIER_CONFIG[tier] ?? TIER_CONFIG.NORMAL;
								return (
									<tr key={customer.id} className="hover:bg-stone-50">
										<td className="px-4 py-3 text-stone-800">{customer.name}</td>
										<td className="px-4 py-3 text-stone-600">{customer.email}</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-2">
												<span
													className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeClass}`}
												>
													{config.label}
												</span>
												<select
													value={tier}
													disabled={tierMutation.isPending}
													onChange={(e) => {
														tierMutation.mutate({
															userId: customer.id,
															tier: e.target.value as TierKey,
														});
													}}
													className="rounded border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-400"
												>
													{tierOptions.map((t) => (
														<option key={t} value={t}>
															{TIER_CONFIG[t].label}
														</option>
													))}
												</select>
											</div>
										</td>
										<td className="px-4 py-3 text-right text-stone-800">
											{customer.orderCount}
										</td>
										<td className="px-4 py-3 text-right text-stone-500">
											{customer.lastOrderAt
												? format(new Date(customer.lastOrderAt), "yyyy/MM/dd")
												: "-"}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			<div className="flex items-center justify-end gap-3">
				<button
					type="button"
					onClick={() => setPage((p) => Math.max(1, p - 1))}
					disabled={page <= 1}
					className="rounded-md border border-stone-200 px-3 py-1.5 text-sm text-stone-700 disabled:opacity-40 hover:bg-stone-50"
				>
					上一頁
				</button>
				<span className="text-sm text-stone-500">
					第 {page} / {totalPages} 頁
				</span>
				<button
					type="button"
					onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
					disabled={page >= totalPages}
					className="rounded-md border border-stone-200 px-3 py-1.5 text-sm text-stone-700 disabled:opacity-40 hover:bg-stone-50"
				>
					下一頁
				</button>
			</div>
		</div>
	);
}
