"use client";

import { useSession } from "@auth/hooks/use-session";
import { authClient } from "@repo/auth/client";
import { Button, Input, toastError, toastSuccess } from "@repo/ui";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";

export function AccountSettingsPage() {
	const { user } = useSession();
	const [name, setName] = useState(user?.name ?? "");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [saving, setSaving] = useState(false);
	const [changingPassword, setChangingPassword] = useState(false);

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
