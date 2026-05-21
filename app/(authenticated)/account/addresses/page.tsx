"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
	toastError,
	toastSuccess,
} from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { useState } from "react";

type Address = {
	id: string;
	label: string | null;
	name: string;
	phone: string;
	address: string;
	idNumber: string | null;
	lineId: string | null;
	isDefault: boolean;
};

type FormData = {
	label: string;
	name: string;
	phone: string;
	address: string;
	idNumber: string;
	lineId: string;
};

const emptyForm: FormData = {
	label: "",
	name: "",
	phone: "",
	address: "",
	idNumber: "",
	lineId: "",
};

export default function AddressesPage() {
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingAddress, setEditingAddress] = useState<Address | null>(null);
	const [form, setForm] = useState<FormData>(emptyForm);
	const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

	const addressesQuery = useQuery(orpc.anismile.addresses.list.queryOptions({ input: {} }));
	const addresses = (addressesQuery.data ?? []) as Address[];

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: orpc.anismile.addresses.list.key() });

	const createMutation = useMutation(
		orpc.anismile.addresses.create.mutationOptions({
			onSuccess: () => {
				toastSuccess("地址已新增");
				setDialogOpen(false);
				void invalidate();
			},
			onError: (error) => toastError(error.message || "新增失敗"),
		}),
	);

	const updateMutation = useMutation(
		orpc.anismile.addresses.update.mutationOptions({
			onSuccess: () => {
				toastSuccess("地址已更新");
				setDialogOpen(false);
				void invalidate();
			},
			onError: (error) => toastError(error.message || "更新失敗"),
		}),
	);

	const deleteMutation = useMutation(
		orpc.anismile.addresses.delete.mutationOptions({
			onSuccess: () => {
				toastSuccess("地址已刪除");
				setDeleteConfirmId(null);
				void invalidate();
			},
			onError: (error) => toastError(error.message || "刪除失敗"),
		}),
	);

	const setDefaultMutation = useMutation(
		orpc.anismile.addresses.setDefault.mutationOptions({
			onSuccess: () => {
				toastSuccess("預設地址已更新");
				void invalidate();
			},
			onError: (error) => toastError(error.message || "設定失敗"),
		}),
	);

	function openCreate() {
		setEditingAddress(null);
		setForm(emptyForm);
		setFormErrors({});
		setDialogOpen(true);
	}

	function openEdit(addr: Address) {
		setEditingAddress(addr);
		setForm({
			label: addr.label ?? "",
			name: addr.name,
			phone: addr.phone,
			address: addr.address,
			idNumber: addr.idNumber ?? "",
			lineId: addr.lineId ?? "",
		});
		setFormErrors({});
		setDialogOpen(true);
	}

	function validateForm() {
		const errors: Partial<Record<keyof FormData, string>> = {};
		if (!form.name.trim()) errors.name = "必填";
		if (!form.phone.trim()) errors.phone = "必填";
		if (!form.address.trim()) errors.address = "必填";
		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	}

	function handleSubmit() {
		if (!validateForm()) return;
		const payload = {
			label: form.label.trim() || undefined,
			name: form.name.trim(),
			phone: form.phone.trim(),
			address: form.address.trim(),
			idNumber: form.idNumber.trim() || undefined,
			lineId: form.lineId.trim() || undefined,
		};
		if (editingAddress) {
			updateMutation.mutate({ id: editingAddress.id, ...payload });
		} else {
			createMutation.mutate(payload);
		}
	}

	const isPending = createMutation.isPending || updateMutation.isPending;

	if (addressesQuery.isLoading) {
		return <div className="text-sm text-stone-500">載入中...</div>;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="font-semibold text-2xl">收貨地址</h1>
				<Button onClick={openCreate}>新增地址</Button>
			</div>

			{addresses.length === 0 ? (
				<div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 py-12 text-stone-500">
					<MapPin className="size-10 text-stone-300" />
					<p className="text-sm">尚未新增任何收貨地址</p>
					<Button onClick={openCreate}>新增第一個收貨地址</Button>
				</div>
			) : (
				<div className="space-y-3">
					{addresses.map((addr) => (
						<div
							key={addr.id}
							className="flex items-start justify-between rounded-xl border border-stone-200 bg-white p-4"
						>
							<div className="space-y-1 text-sm">
								<div className="flex items-center gap-2">
									{addr.label && (
										<span className="font-medium text-stone-700">{addr.label}</span>
									)}
									{addr.isDefault && <Badge status="info">預設</Badge>}
								</div>
								<p className="text-stone-800">
									{addr.name} · {addr.phone}
								</p>
								<p className="max-w-xs truncate text-stone-500">{addr.address}</p>
							</div>
							<div className="flex shrink-0 gap-2">
								{!addr.isDefault && (
									<button
										type="button"
										className="text-xs text-stone-500 underline-offset-2 hover:underline"
										disabled={setDefaultMutation.isPending}
										onClick={() => setDefaultMutation.mutate({ id: addr.id })}
									>
										設為預設
									</button>
								)}
								<button
									type="button"
									className="text-xs text-stone-500 underline-offset-2 hover:underline"
									onClick={() => openEdit(addr)}
								>
									編輯
								</button>
								<button
									type="button"
									className="text-xs text-red-500 underline-offset-2 hover:underline"
									onClick={() => setDeleteConfirmId(addr.id)}
								>
									刪除
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Address Form Dialog */}
			<Dialog
				open={dialogOpen}
				onOpenChange={(open) => {
					if (!isPending) setDialogOpen(open);
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{editingAddress ? "編輯地址" : "新增地址"}</DialogTitle>
					</DialogHeader>

					<div className="space-y-3">
						<div className="space-y-1">
							<label className="text-sm text-stone-700">標籤（選填）</label>
							<Input
								placeholder="例如：家、公司"
								value={form.label}
								onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
							/>
						</div>

						<div className="space-y-1">
							<label className="text-sm text-stone-700">
								收件人姓名 <span className="text-red-500">*</span>
							</label>
							<Input
								placeholder="請輸入姓名"
								value={form.name}
								onChange={(e) => {
									setForm((f) => ({ ...f, name: e.target.value }));
									if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
								}}
							/>
							{formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
						</div>

						<div className="space-y-1">
							<label className="text-sm text-stone-700">
								聯絡電話 <span className="text-red-500">*</span>
							</label>
							<Input
								placeholder="請輸入電話"
								value={form.phone}
								onChange={(e) => {
									setForm((f) => ({ ...f, phone: e.target.value }));
									if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }));
								}}
							/>
							{formErrors.phone && <p className="text-xs text-red-500">{formErrors.phone}</p>}
						</div>

						<div className="space-y-1">
							<label className="text-sm text-stone-700">
								收貨地址 <span className="text-red-500">*</span>
							</label>
							<textarea
								rows={3}
								className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
								placeholder="請輸入完整收貨地址"
								value={form.address}
								onChange={(e) => {
									setForm((f) => ({ ...f, address: e.target.value }));
									if (formErrors.address)
										setFormErrors((prev) => ({ ...prev, address: undefined }));
								}}
							/>
							{formErrors.address && (
								<p className="text-xs text-red-500">{formErrors.address}</p>
							)}
						</div>

						<div className="space-y-1">
							<label className="text-sm text-stone-700">身份證號（選填）</label>
							<Input
								placeholder="清關用，可留空"
								value={form.idNumber}
								onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))}
							/>
						</div>

						<div className="space-y-1">
							<label className="text-sm text-stone-700">LINE ID（選填）</label>
							<Input
								placeholder="方便聯絡"
								value={form.lineId}
								onChange={(e) => setForm((f) => ({ ...f, lineId: e.target.value }))}
							/>
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setDialogOpen(false)}
								disabled={isPending}
							>
								取消
							</Button>
							<Button onClick={handleSubmit} disabled={isPending}>
								{isPending ? "儲存中..." : "儲存"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirm AlertDialog */}
			<AlertDialog
				open={deleteConfirmId !== null}
				onOpenChange={(open) => {
					if (!open && !deleteMutation.isPending) setDeleteConfirmId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>確認刪除</AlertDialogTitle>
						<AlertDialogDescription>刪除後無法復原，確定要刪除這個地址嗎？</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>取消</AlertDialogCancel>
						<AlertDialogAction
							disabled={deleteMutation.isPending}
							onClick={() => {
								if (deleteConfirmId) {
									deleteMutation.mutate({ id: deleteConfirmId });
								}
							}}
						>
							{deleteMutation.isPending ? "刪除中..." : "確認刪除"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
