"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const roleOptions = ["customer", "admin", "super_admin"] as const;

export function AdminSettingsPage() {
	const queryClient = useQueryClient();
	const [markup, setMarkup] = useState("1.2");

	// 批發折扣率（% 輸入，如 3 → 存 0.03）
	const [wholesaleDiscountPct, setWholesaleDiscountPct] = useState("3");
	// VIP 折扣率
	const [vipDiscountPct, setVipDiscountPct] = useState("5");
	// 升級門檻（整數 TWD）
	const [wholesaleThreshold, setWholesaleThreshold] = useState("5000000");
	const [vipThreshold, setVipThreshold] = useState("10000000");

	const defaultMarkupQuery = useQuery(orpc.anismile.settings.getDefaultMarkup.queryOptions({ input: {} }));
	const tierSettingsQuery = useQuery(orpc.anismile.settings.getTierSettings.queryOptions({ input: {} }));
	const usersQuery = useQuery(orpc.anismile.users.listRoles.queryOptions({ input: {} }));

	useEffect(() => {
		if (tierSettingsQuery.data) {
			setWholesaleDiscountPct(String(Math.round(tierSettingsQuery.data.wholesaleDiscount * 100)));
			setVipDiscountPct(String(Math.round(tierSettingsQuery.data.vipDiscount * 100)));
			setWholesaleThreshold(String(tierSettingsQuery.data.wholesaleThreshold));
			setVipThreshold(String(tierSettingsQuery.data.vipThreshold));
		}
	}, [tierSettingsQuery.data]);

	const markupMutation = useMutation(
		orpc.anismile.settings.patchDefaultMarkup.mutationOptions({
			onSuccess: () => {
				toastSuccess("預設利潤率已更新");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.settings.getDefaultMarkup.key() });
			},
			onError: (error) => toastError(error.message || "更新失敗"),
		}),
	);

	const tierMutation = useMutation(
		orpc.anismile.settings.patchTierSettings.mutationOptions({
			onSuccess: () => {
				toastSuccess("會員等級設定已更新");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.settings.getTierSettings.key() });
			},
			onError: (error) => toastError(error.message || "更新失敗"),
		}),
	);

	const roleMutation = useMutation(
		orpc.anismile.users.patchRole.mutationOptions({
			onSuccess: () => {
				toastSuccess("角色已更新");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.users.listRoles.key() });
			},
			onError: (error) => toastError(error.message || "角色更新失敗"),
		}),
	);

	const handleSaveTierSettings = () => {
		const wholesaleDiscount = Number.parseFloat(wholesaleDiscountPct) / 100;
		const vipDiscount = Number.parseFloat(vipDiscountPct) / 100;
		const wThreshold = Number.parseInt(wholesaleThreshold, 10);
		const vThreshold = Number.parseInt(vipThreshold, 10);
		if (
			Number.isNaN(wholesaleDiscount) || wholesaleDiscount < 0 || wholesaleDiscount > 1 ||
			Number.isNaN(vipDiscount) || vipDiscount < 0 || vipDiscount > 1 ||
			Number.isNaN(wThreshold) || wThreshold <= 0 ||
			Number.isNaN(vThreshold) || vThreshold <= 0
		) {
			toastError("請輸入有效數值");
			return;
		}
		tierMutation.mutate({
			wholesaleDiscount,
			vipDiscount,
			wholesaleThreshold: wThreshold,
			vipThreshold: vThreshold,
		});
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>預設利潤率</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">
						目前值：{defaultMarkupQuery.data?.value?.toString() ?? "載入中..."}
					</p>
					<div className="flex gap-2">
						<Input value={markup} onChange={(event) => setMarkup(event.target.value)} placeholder="例如 1.2" />
						<Button
							onClick={() =>
								markupMutation.mutate({
									markup: Number.parseFloat(markup),
								})
							}
							disabled={markupMutation.isPending}
						>
							更新
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>會員等級設定</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">設定各等級的折扣率與升級門檻（台幣）。</p>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-1">
							<label className="text-sm font-medium text-stone-700">批發（WHOLESALE）折扣率 %</label>
							<Input
								type="number"
								min="0"
								max="100"
								step="0.1"
								value={wholesaleDiscountPct}
								onChange={(e) => setWholesaleDiscountPct(e.target.value)}
								placeholder="例如 3"
							/>
							<p className="text-xs text-stone-400">輸入 3 代表 3% 折扣（帳單金額 × 0.97）</p>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-medium text-stone-700">VIP 折扣率 %</label>
							<Input
								type="number"
								min="0"
								max="100"
								step="0.1"
								value={vipDiscountPct}
								onChange={(e) => setVipDiscountPct(e.target.value)}
								placeholder="例如 5"
							/>
							<p className="text-xs text-stone-400">輸入 5 代表 5% 折扣（帳單金額 × 0.95）</p>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-medium text-stone-700">批發升級門檻（TWD）</label>
							<Input
								type="number"
								min="1"
								step="1"
								value={wholesaleThreshold}
								onChange={(e) => setWholesaleThreshold(e.target.value)}
								placeholder="例如 5000000"
							/>
							<p className="text-xs text-stone-400">當月訂貨額達此金額可升批發等級</p>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-medium text-stone-700">VIP 升級門檻（TWD）</label>
							<Input
								type="number"
								min="1"
								step="1"
								value={vipThreshold}
								onChange={(e) => setVipThreshold(e.target.value)}
								placeholder="例如 10000000"
							/>
							<p className="text-xs text-stone-400">當月訂貨額達此金額可升 VIP 等級</p>
						</div>
					</div>
					<Button onClick={handleSaveTierSettings} disabled={tierMutation.isPending}>
						儲存等級設定
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>用戶角色管理</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>姓名</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>角色</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{(usersQuery.data ?? []).map((user) => (
								<TableRow key={user.id}>
									<TableCell>{user.name}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<select
											className="rounded-md border bg-card px-2 py-1 text-sm"
											defaultValue={user.role ?? "customer"}
											onChange={(event) =>
												roleMutation.mutate({
													id: user.id,
													role: event.target.value as (typeof roleOptions)[number],
												})
											}
										>
											{roleOptions.map((role) => (
												<option key={role} value={role}>
													{role}
												</option>
											))}
										</select>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
