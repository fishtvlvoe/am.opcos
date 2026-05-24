"use client";

import { toastError, toastSuccess } from "@repo/ui";
import { Button } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Address = {
	id: string;
	label: string | null;
	name: string;
	phone: string;
	address: string;
	idNumber: string | null;
	isDefault: boolean;
};

export function CheckoutPage() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
	const [shippingName, setShippingName] = useState("");
	const [shippingPhone, setShippingPhone] = useState("");
	const [shippingAddress, setShippingAddress] = useState("");
	const [notes, setNotes] = useState("");
	const [errors, setErrors] = useState<{ shippingName?: string; shippingPhone?: string; shippingAddress?: string }>({});
	const [orderPlaced, setOrderPlaced] = useState(false);

	const addressesQuery = useQuery(orpc.anismile.addresses.list.queryOptions({ input: {} }));
	const addresses = useMemo(() => (addressesQuery.data ?? []) as Address[], [addressesQuery.data]);

	useEffect(() => {
		if (addressesQuery.isSuccess && addresses.length > 0) {
			const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
			if (defaultAddr) {
				setSelectedAddressId(defaultAddr.id);
			}
		}
	}, [addressesQuery.isSuccess, addresses]);

	const cartQuery = useQuery(orpc.anismile.cart.getItems.queryOptions({ input: {} }));
	const cartItems = cartQuery.data?.items ?? [];
	const cartTotal = useMemo(() => Number(cartQuery.data?.total ?? 0), [cartQuery.data]);
	const itemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
	const hasUnavailableItems = cartItems.some((item) => Boolean(item.unavailableReason));
	const selectedAddress =
		selectedAddressId !== "new"
			? addresses.find((address) => address.id === selectedAddressId)
			: null;

	useEffect(() => {
		if (cartQuery.isSuccess && cartItems.length === 0 && !orderPlaced) {
			router.push("/cart");
		}
	}, [cartQuery.isSuccess, cartItems.length, router, orderPlaced]);

	const checkoutMutation = useMutation(
		orpc.anismile.cart.checkout.mutationOptions({
			onSuccess: ({ orderId }: { orderId: string }) => {
				setOrderPlaced(true);
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.cart.getItems.key() });
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.orders.list.key() });
				toastSuccess("訂單已建立");
				router.push(`/orders/${orderId}/confirmation`);
			},
			onError: (error) => toastError(error.message || "送出訂單失敗"),
		}),
	);

	function validate() {
		if (selectedAddressId !== "new") {
			const exists = addresses.some((a) => a.id === selectedAddressId);
			if (!exists) {
				toastError("選擇的地址已不存在，請重新選擇");
				setSelectedAddressId("new");
				return false;
			}
			return true;
		}
		const next: typeof errors = {};
		if (!shippingName.trim()) next.shippingName = "請填寫收件人姓名";
		if (!shippingPhone.trim()) next.shippingPhone = "請填寫聯絡電話";
		if (!shippingAddress.trim()) next.shippingAddress = "請填寫配送地址";
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	function handleSubmit() {
		if (hasUnavailableItems) {
			toastError("購物車含有無法下單商品，請先返回購物車調整");
			return;
		}
		if (!validate()) return;
		let name = shippingName.trim();
		let phone = shippingPhone.trim();
		let address = shippingAddress.trim();
		if (selectedAddressId !== "new") {
			const found = addresses.find((a) => a.id === selectedAddressId);
			if (!found) return;
			name = found.name;
			phone = found.phone;
			address = found.address;
		}
		checkoutMutation.mutate({
			shippingName: name,
			shippingPhone: phone,
			shippingAddress: address,
			note: notes.trim() || undefined,
		});
	}

	if (cartQuery.isLoading) {
		return (
			<div className="text-sm text-stone-500">載入中...</div>
		);
	}

	return (
		<div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:gap-6">
			<div className="space-y-4">
				<h1 className="font-semibold text-2xl">結帳</h1>

				<section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
					<h2 className="font-semibold text-lg text-stone-900">配送資訊</h2>

					{addresses.length > 0 && (
						<div className="space-y-2">
							{addresses.map((addr) => (
								<label
									key={addr.id}
									className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 hover:bg-stone-50"
								>
									<input
										type="radio"
										name="addressSelect"
										value={addr.id}
										checked={selectedAddressId === addr.id}
										onChange={() => setSelectedAddressId(addr.id)}
										className="mt-0.5 shrink-0"
									/>
									<span className="text-sm text-stone-700">
										{addr.label ? `${addr.label} - ` : ""}
										{addr.name} / {addr.phone} / {addr.address.length > 50 ? addr.address.slice(0, 50) + "…" : addr.address}
									</span>
								</label>
							))}
							<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 p-3 hover:bg-stone-50">
								<input
									type="radio"
									name="addressSelect"
									value="new"
									checked={selectedAddressId === "new"}
									onChange={() => setSelectedAddressId("new")}
									className="shrink-0"
								/>
								<span className="text-sm text-stone-700">使用新地址</span>
							</label>
						</div>
					)}
					{selectedAddress?.idNumber ? (
						<div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
							身份證號：{selectedAddress.idNumber}
						</div>
					) : null}

					{(selectedAddressId === "new" || addresses.length === 0) && (
						<div className="space-y-3">
							<div className="space-y-1">
								<label className="text-sm text-stone-700">
									收件人姓名 <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									maxLength={100}
									className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-stone-500"
									placeholder="請輸入收件人姓名"
									value={shippingName}
									onChange={(e) => {
										setShippingName(e.target.value);
										if (errors.shippingName) setErrors((prev) => ({ ...prev, shippingName: undefined }));
									}}
								/>
								{errors.shippingName && (
									<p className="text-xs text-red-500">{errors.shippingName}</p>
								)}
							</div>

							<div className="space-y-1">
								<label className="text-sm text-stone-700">
									聯絡電話 <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									maxLength={30}
									className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-stone-500"
									placeholder="請輸入聯絡電話"
									value={shippingPhone}
									onChange={(e) => {
										setShippingPhone(e.target.value);
										if (errors.shippingPhone) setErrors((prev) => ({ ...prev, shippingPhone: undefined }));
									}}
								/>
								{errors.shippingPhone && (
									<p className="text-xs text-red-500">{errors.shippingPhone}</p>
								)}
							</div>

							<div className="space-y-1">
								<label className="text-sm text-stone-700">
									配送地址 <span className="text-red-500">*</span>
								</label>
								<textarea
									rows={3}
									className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-stone-500"
									placeholder="請輸入完整配送地址"
									value={shippingAddress}
									onChange={(e) => {
										setShippingAddress(e.target.value);
										if (errors.shippingAddress) setErrors((prev) => ({ ...prev, shippingAddress: undefined }));
									}}
								/>
								{errors.shippingAddress && (
									<p className="text-xs text-red-500">{errors.shippingAddress}</p>
								)}
							</div>
						</div>
					)}

					<div className="space-y-1">
						<label className="text-sm text-stone-700">備註</label>
						<textarea
							rows={3}
							className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition-colors focus:border-stone-500"
							placeholder="例如：請盡快出貨"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</div>
					<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
						目前採人工付款審核，下單後由管理員確認款項並安排出貨。
					</div>
				</section>
			</div>

			<section className="h-fit space-y-4 rounded-xl border border-stone-200 bg-white p-4">
				<h2 className="font-semibold text-lg text-stone-900">訂單摘要</h2>
				<div className="space-y-2 text-sm">
					{cartItems.map((item) => (
						<div key={item.id} className="space-y-1">
							<div className="flex items-center justify-between">
								<span className="line-clamp-1 max-w-[160px] text-stone-600">
									{item.product.titleTranslated || item.product.titleOriginal}
									<span className="ml-1 text-stone-500">×{item.quantity}</span>
								</span>
								<span className="font-medium text-stone-900">¥ {Number(item.lineTotal).toFixed(2)}</span>
							</div>
							{item.unavailableReason ? (
								<p className="text-xs text-red-600">{item.unavailableReason}</p>
							) : null}
						</div>
					))}
					<div className="flex items-center justify-between">
						<span className="text-stone-600">品項數</span>
						<span className="font-medium text-stone-900">{itemCount}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-stone-600">運費</span>
						<span className="text-stone-600">運費另計</span>
					</div>
					<div className="flex items-center justify-between border-t border-stone-200 pt-2">
						<span className="font-medium text-stone-700">合計</span>
						<span className="font-semibold text-stone-900">¥ {cartTotal.toFixed(2)}</span>
					</div>
				</div>

				<Button
					className="w-full"
					disabled={checkoutMutation.isPending || cartItems.length === 0 || hasUnavailableItems}
					onClick={handleSubmit}
				>
					{checkoutMutation.isPending ? "送出中..." : "確認下單"}
				</Button>
			</section>
		</div>
	);
}
