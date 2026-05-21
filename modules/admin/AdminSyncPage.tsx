"use client";

import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, toastError, toastInfo } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDuration, intervalToDuration } from "date-fns";

const STATUS_BADGE: Record<string, { label: string; status: "info" | "success" | "warning" | "error" }> = {
	running: { label: "進行中", status: "info" },
	completed: { label: "完成", status: "success" },
	failed: { label: "失敗", status: "error" },
};

function formatElapsed(startedAt: string | Date, finishedAt?: string | Date | null): string {
	const start = new Date(startedAt);
	const end = finishedAt ? new Date(finishedAt) : new Date();
	const duration = intervalToDuration({ start, end });
	return formatDuration(duration, { format: ["minutes", "seconds"] }) || "< 1 秒";
}

export function AdminSyncPage() {
	const queryClient = useQueryClient();
	const logsQuery = useQuery(orpc.anismile.syncLogs.queryOptions({ input: {} }));

	// 偵測是否有進行中的同步（防止重複觸發）
	const hasRunning = (logsQuery.data ?? []).some((row) => row.status === "running");

	const syncMutation = useMutation(
		orpc.anismile.sync.mutationOptions({
			onSuccess: (result) => {
				toastInfo(`同步已啟動：${result.syncLogId}`);
				setTimeout(() => {
					void queryClient.invalidateQueries({ queryKey: orpc.anismile.syncLogs.key() });
				}, 3000);
			},
			onError: (error) => toastError(error.message || "同步啟動失敗"),
		}),
	);

	const isSyncDisabled = syncMutation.isPending || hasRunning;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="font-semibold text-2xl">同步管理</h1>
				<div className="flex items-center gap-3">
					{hasRunning && (
						<span className="text-muted-foreground text-sm">同步進行中，請稍候…</span>
					)}
					<Button
						onClick={() => syncMutation.mutate({})}
						disabled={isSyncDisabled}
					>
						{syncMutation.isPending ? "啟動中..." : "立即同步"}
					</Button>
				</div>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>開始時間</TableHead>
						<TableHead>結束時間</TableHead>
						<TableHead>狀態</TableHead>
						<TableHead>同步數</TableHead>
						<TableHead>新增</TableHead>
						<TableHead>更新</TableHead>
						<TableHead>耗時</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{(logsQuery.data ?? []).map((row) => {
						const badgeProps = STATUS_BADGE[row.status] ?? { label: row.status, status: "info" as const };
						return (
							<TableRow key={row.id}>
								<TableCell>{format(new Date(row.startedAt), "yyyy-MM-dd HH:mm")}</TableCell>
								<TableCell>
									{row.finishedAt ? format(new Date(row.finishedAt), "yyyy-MM-dd HH:mm") : "-"}
								</TableCell>
								<TableCell>
									<Badge status={badgeProps.status}>{badgeProps.label}</Badge>
								</TableCell>
								<TableCell>{row.productsSynced}</TableCell>
								<TableCell>{row.productsAdded}</TableCell>
								<TableCell>{row.productsUpdated}</TableCell>
								<TableCell>{formatElapsed(row.startedAt, row.finishedAt)}</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
