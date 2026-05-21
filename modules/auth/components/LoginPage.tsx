"use client";

import { authClient } from "@repo/auth/client";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Tab = "login" | "register";

export function LoginPage() {
	const router = useRouter();
	const [tab, setTab] = useState<Tab>("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = (): boolean => {
		const next: Record<string, string> = {};
		if (!email.trim()) next.email = "請輸入電子郵件";
		if (!password) next.password = "請輸入密碼";
		else if (password.length < 8) next.password = "密碼至少 8 個字元";
		if (tab === "register" && !name.trim()) next.name = "請輸入姓名";
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;
		setLoading(true);
		try {
			if (tab === "login") {
				const { error } = await authClient.signIn.email({ email, password });
				if (error) {
					toast.error(error.message ?? "登入失敗，請確認帳號與密碼");
				} else {
					router.push("/");
					router.refresh();
				}
			} else {
				const { error } = await authClient.signUp.email({ email, password, name });
				if (error) {
					toast.error(error.message ?? "註冊失敗，請稍後再試");
				} else {
					toast.success("註冊成功，歡迎加入！");
					router.push("/");
					router.refresh();
				}
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
			<div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
				<div className="mb-6 text-center">
					<span className="inline-flex size-10 items-center justify-center rounded-xl bg-stone-900 text-lg font-bold text-white">
						A
					</span>
					<h1 className="mt-3 text-xl font-semibold text-stone-900">anismile 採購平台</h1>
				</div>

				<div className="mb-6 flex rounded-lg bg-stone-100 p-1">
					<button
						type="button"
						onClick={() => { setTab("login"); setErrors({}); }}
						className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
							tab === "login"
								? "bg-white text-stone-900 shadow-sm"
								: "text-stone-500 hover:text-stone-700"
						}`}
					>
						登入
					</button>
					<button
						type="button"
						onClick={() => { setTab("register"); setErrors({}); }}
						className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
							tab === "register"
								? "bg-white text-stone-900 shadow-sm"
								: "text-stone-500 hover:text-stone-700"
						}`}
					>
						註冊
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{tab === "register" && (
						<div>
							<label htmlFor="name" className="mb-1 block text-sm font-medium text-stone-700">
								姓名
							</label>
							<input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="請輸入姓名"
								className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
							/>
							{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
						</div>
					)}

					<div>
						<label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">
							電子郵件
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="email@example.com"
							className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
						/>
						{errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
					</div>

					<div>
						<label htmlFor="password" className="mb-1 block text-sm font-medium text-stone-700">
							密碼
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder={tab === "register" ? "至少 8 個字元" : "請輸入密碼"}
							className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
						/>
						{errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
					</div>

					<button
						type="submit"
						disabled={loading}
						className="mt-2 w-full rounded-lg bg-stone-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
					>
						{loading ? "處理中…" : tab === "login" ? "登入" : "建立帳號"}
					</button>
				</form>
			</div>
		</div>
	);
}
