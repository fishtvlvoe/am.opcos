"use client";

import { useSession } from "@auth/hooks/use-session";
import { authClient } from "@repo/auth/client";
import { Button, Input, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SettingsIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

export function AccountSettingsPage() {
	const { user } = useSession();
	const queryClient = useQueryClient();
	const [name, setName] = useState(user?.name ?? "");
	const [shippingName, setShippingName] = useState("");
	const [shippingPhone, setShippingPhone] = useState("");
	const [shippingAddress, setShippingAddress] = useState("");
	const [idNumber, setIdNumber] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [saving, setSaving] = useState(false);
	const [changingPassword, setChangingPassword] = useState(false);

	const addressesQuery = useQuery(orpc.anismile.addresses.list.queryOptions({ input: {} }));
	const addresses = useMemo(() => (addressesQuery.data ?? []) as Address[], [addressesQuery.data]);
	const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;

	useEffect(() => {
		if (user?.name) setName(user.name);
	}, [user?.name]);

	useEffect(() => {
		if (!defaultAddress) return;
		setShippingName(defaultAddress.name);
		setShippingPhone(defaultAddress.phone);
		setShippingAddress(defaultAddress.address);
		setIdNumber(defaultAddress.idNumber ?? "");
	}, [defaultAddress]);

	const invalidateAddresses = () =>
		queryClient.invalidateQueries({ queryKey: orpc.anismile.addresses.list.key() });

	const createAddressMutation = useMutation(
		orpc.anismile.addresses.create.mutationOptions({
			onSuccess: (created) => {
				const createdAddress = created as Address;
				if (createdAddress.id) {
					setDefaultAddressMutation.mutate({ id: createdAddress.id });
				} else {
					void invalidateAddresses();
				}
				toastSuccess("常用收件資料已儲存");
			},
			onError: (error) => toastError(error.message || "儲存失敗"),
		}),
	);

	const updateAddressMutation = useMutation(
		orpc.anismile.addresses.update.mutationOptions({
			onSuccess: () => {
				toastSuccess("常用收件資料已更新");
				void invalidateAddresses();
			},
			onError: (error) => toastError(error.message || "更新失敗"),
		}),
	);

	const setDefaultAddressMutation = useMutation(
		orpc.anismile.addresses.setDefault.mutationOptions({
			onSuccess: () => {
				void invalidateAddresses();
			},
			onError: (error) => toastError(error.message || "預設地址設定失敗"),
		}),
	);

	const handleUpdateProfile = async () => {
		setSaving(true);
		try {
			await authClient.updateUser({ name });
			toastSuccess("個人資料已更新");
		} catch (error) {
			toastError(error instanceof Error ? error.message : "更新失敗");
		} finally {
			setSaving(false);
		}
	};

	const handleSaveDefaultAddress = () => {
		const payload = {
			label: "常用地址",
			name: shippingName.trim(),
			phone: shippingPhone.trim(),
			address: shippingAddress.trim(),
			idNumber: idNumber.trim() || undefined,
		};
		if (!payload.name || !payload.phone || !payload.address) {
			toastError("姓名、電話、地址為必填");
			return;
		}
		if (defaultAddress) {
			updateAddressMutation.mutate({ id: defaultAddress.id, ...payload });
		} else {
			createAddressMutation.mutate(payload);
		}
	};

	const handleChangePassword = async () => {
		if (newPassword !== confirmPassword) {
			toastError("新密碼與確認密碼不一致");
			return;
		}
		if (newPassword.length < 8) {
			toastError("新密碼至少 8 個字元");
			return;
		}
		setChangingPassword(true);
		try {
			await authClient.changePassword({
				currentPassword,
				newPassword,
			});
			toastSuccess("密碼已更新");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error) {
			toastError(error instanceof Error ? error.message : "密碼更新失敗");
		} finally {
			setChangingPassword(false);
		}
	};

	const savingAddress =
		createAddressMutation.isPending ||
		updateAddressMutation.isPending ||
		setDefaultAddressMutation.isPending;

	if (!user) {
		return <p className="text-sm text-stone-500">載入中...</p>;
	}

	return (
		<div className="container max-w-2xl py-8">
			<div className="mb-8 flex items-center gap-3">
				<SettingsIcon className="size-6 text-stone-600" />
				<h1 className="text-2xl font-bold text-stone-900">帳號設定</h1>
			</div>

			<div className="space-y-8">
				<section className="rounded-xl border border-stone-200 bg-white p-6">
					<h2 className="mb-4 text-lg font-semibold text-stone-900">個人資料</h2>
					<div className="space-y-4">
						<div>
							<label className="mb-1.5 block text-sm font-medium text-stone-700">名稱</label>
							<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="輸入名稱" />
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
							<Input value={user.email ?? ""} disabled className="bg-stone-50" />
						</div>
						<Button onClick={handleUpdateProfile} disabled={saving}>
							{saving ? "儲存中..." : "儲存變更"}
						</Button>
					</div>
				</section>

				<section className="rounded-xl border border-stone-200 bg-white p-6">
					<h2 className="mb-4 text-lg font-semibold text-stone-900">常用收件資料</h2>
					<div className="space-y-4">
						<div>
							<label className="mb-1.5 block text-sm font-medium text-stone-700">
								姓名 <span className="text-red-500">*</span>
							</label>
							<Input
								value={shippingName}
								onChange={(e) => setShippingName(e.target.value)}
								placeholder="收件人姓名"
							/>
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-stone-700">
								電話 <span className="text-red-500">*</span>
							</label>
							<Input
								value={shippingPhone}
								onChange={(e) => setShippingPhone(e.target.value)}
								placeholder="聯絡電話"
							/>
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-stone-700">
								地址 <span className="text-red-500">*</span>
							</label>
							<textarea
								rows={3}
								className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
								value={shippingAddress}
								onChange={(e) => setShippingAddress(e.target.value)}
								placeholder="完整收件地址"
							/>
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-stone-700">身份證字號</label>
							<Input
								value={idNumber}
								onChange={(e) => setIdNumber(e.target.value)}
								placeholder="清關用，可留空"
							/>
						</div>
						<Button onClick={handleSaveDefaultAddress} disabled={savingAddress || addressesQuery.isLoading}>
							{savingAddress ? "儲存中..." : "儲存常用收件資料"}
						</Button>
					</div>
				</section>

				<section className="rounded-xl border border-stone-200 bg-white p-6">
					<h2 className="mb-4 text-lg font-semibold text-stone-900">修改密碼</h2>
					<div className="space-y-4">
						<div>
							<label className="mb-1.5 block text-sm font-medium text-stone-700">目前密碼</label>
							<Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-stone-700">新密碼</label>
							<Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-stone-700">確認新密碼</label>
							<Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
						</div>
						<Button onClick={handleChangePassword} disabled={changingPassword}>
							{changingPassword ? "更新中..." : "更新密碼"}
						</Button>
					</div>
				</section>
			</div>
		</div>
	);
}
