"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toastError,
	toastSuccess,
} from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
	titleTranslated: z.string().min(1, "名稱不可空白").optional(),
	sellingPrice: z.number().positive().optional(),
	markupOverride: z.number().min(0).max(100).nullable().optional(),
	discountRate: z.number().min(0).max(1).nullable().optional(),
	saleStatus: z.enum(["預售中", "有現貨"]).nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditProductModalProps {
	product: {
		id: string;
		titleTranslated: string;
		sellingPrice: number;
		markupOverride: number | null;
		discountRate: number | null;
		saleStatus: string | null;
		priceManualOverride: boolean;
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function EditProductModal({ product, open, onOpenChange, onSuccess }: EditProductModalProps) {
	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			titleTranslated: product.titleTranslated,
			sellingPrice: product.sellingPrice,
			markupOverride: product.markupOverride,
			discountRate: product.discountRate,
			saleStatus: (product.saleStatus as "預售中" | "有現貨" | null) ?? null,
		},
	});

	useEffect(() => {
		if (open) {
			reset({
				titleTranslated: product.titleTranslated,
				sellingPrice: product.sellingPrice,
				markupOverride: product.markupOverride,
				discountRate: product.discountRate,
				saleStatus: (product.saleStatus as "預售中" | "有現貨" | null) ?? null,
			});
		}
	}, [open, product, reset]);

	const patchProduct = useMutation(
		orpc.anismile.products.patchProduct.mutationOptions({
			onSuccess: () => {
				toastSuccess("商品已更新");
				onOpenChange(false);
				onSuccess();
			},
			onError: (error) => toastError(error.message || "更新失敗"),
		}),
	);

	const onSubmit = (values: FormValues) => {
		patchProduct.mutate({
			id: product.id,
			titleTranslated: values.titleTranslated,
			sellingPrice: values.sellingPrice,
			markupOverride: values.markupOverride,
			discountRate: values.discountRate,
			saleStatus: values.saleStatus,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>編輯商品</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{product.priceManualOverride && (
						<Badge status="warning" className="text-xs">
							手動設價
						</Badge>
					)}

					<div className="space-y-1">
						<label className="text-sm font-medium">中文名稱</label>
						<Input {...register("titleTranslated")} placeholder="商品中文名稱" />
						{errors.titleTranslated && (
							<p className="text-xs text-destructive">{errors.titleTranslated.message}</p>
						)}
					</div>

					<div className="space-y-1">
						<label className="text-sm font-medium">售價（¥）</label>
						<Input
							type="number"
							step="0.01"
							min="0.01"
							placeholder="直接設定最終會員價（覆寫自動回推）"
							{...register("sellingPrice", {
								setValueAs: (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? undefined : Number(v)),
							})}
						/>
						{errors.sellingPrice && (
							<p className="text-xs text-destructive">{errors.sellingPrice.message}</p>
						)}
						<p className="text-xs text-stone-400">直接填寫最終會員價，儲存後會跳過自動回推計算。</p>
					</div>

					<div className="space-y-1">
						<label className="text-sm font-medium">商品回推百分比</label>
						<Input
							type="number"
							step="0.1"
							min="0"
							max="100"
							placeholder="留空使用預設"
							{...register("markupOverride", {
								setValueAs: (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v)),
							})}
						/>
						{errors.markupOverride && (
							<p className="text-xs text-destructive">{errors.markupOverride.message}</p>
						)}
						<p className="text-xs text-stone-400">輸入 10 代表來源 8 折時，此商品改以 9 折賣給客戶。</p>
					</div>

					<div className="space-y-1">
						<label className="text-sm font-medium">折扣率（0–1）</label>
						<Input
							type="number"
							step="0.01"
							min="0"
							max="1"
							placeholder="例：0.9 表示九折"
							{...register("discountRate", {
								setValueAs: (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v)),
							})}
						/>
						{errors.discountRate && (
							<p className="text-xs text-destructive">{errors.discountRate.message}</p>
						)}
					</div>

					<div className="space-y-1">
						<label className="text-sm font-medium">販售狀態</label>
						<Controller
							name="saleStatus"
							control={control}
							render={({ field }) => (
								<Select
									value={field.value ?? ""}
									onValueChange={(v) =>
										field.onChange(v === "_clear" ? null : (v as "預售中" | "有現貨"))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="（未設定）" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="_clear">（清除）</SelectItem>
										<SelectItem value="預售中">預售中</SelectItem>
										<SelectItem value="有現貨">有現貨</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							取消
						</Button>
						<Button type="submit" disabled={patchProduct.isPending}>
							{patchProduct.isPending ? "儲存中..." : "儲存"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
