"use client";

import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { type PropsWithChildren, useMemo } from "react";

// 日幣固定格式（anismile 為日本供應商 B2B 平台）
const JPY = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });
const NUM = new Intl.NumberFormat("zh-TW");
const PCT = new Intl.NumberFormat("zh-TW", { style: "percent" });

export function StatsTile({
	title,
	value,
	context,
	trend,
	valueFormat,
	children,
}: PropsWithChildren<{
	title: string;
	value: number;
	valueFormat: "currency" | "number" | "percentage";
	context?: string;
	icon?: React.ReactNode;
	trend?: number;
}>) {
	const formattedValue = useMemo(() => {
		if (valueFormat === "currency") return JPY.format(value);
		if (valueFormat === "percentage") return PCT.format(value);
		return NUM.format(value);
	}, [value, valueFormat]);

	const formattedTrend = useMemo(() => {
		if (trend == null) return null;
		return `${trend >= 0 ? "+" : ""}${PCT.format(trend)}`;
	}, [trend]);

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<strong className="font-semibold text-2xl lg:text-3xl">
						{formattedValue}
						{context && <small>{context}</small>}
					</strong>
					{trend != null && (
						<Badge status={trend > 0 ? "success" : "error"}>{formattedTrend}</Badge>
					)}
				</div>
				{children ? <div className="mt-4 w-full">{children}</div> : null}
			</CardContent>
		</Card>
	);
}
