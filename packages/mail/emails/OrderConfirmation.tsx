import { Body, Column, Head, Hr, Html, Row, Section, Text } from "@react-email/components";
import React from "react";

import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

type OrderItem = {
	titleTranslated: string;
	quantity: number;
	unitPrice: number;
};

export function OrderConfirmation({
	orderId,
	customerName,
	items,
	totalAmount,
	notes,
}: {
	orderId: string;
	customerName: string;
	items: OrderItem[];
	totalAmount: number;
	notes?: string | null;
} & BaseMailProps) {
	const shortId = orderId.slice(0, 8);

	return (
		<Html>
			<Head />
			<Body>
				<Wrapper>
					<Text className="text-xl font-bold">訂單確認 #{shortId}</Text>
					<Text>親愛的 {customerName}，感謝您的訂購！</Text>
					<Text className="font-semibold">訂單明細：</Text>
					{items.map((item, i) => (
						<Section key={i}>
							<Row>
								<Column>{item.titleTranslated}</Column>
								<Column>x{item.quantity}</Column>
								<Column>¥{item.unitPrice.toLocaleString()}</Column>
							</Row>
						</Section>
					))}
					<Hr />
					<Text className="font-semibold">訂單總額：¥{totalAmount.toLocaleString()}</Text>
					{notes ? <Text>備註：{notes}</Text> : null}
					<Hr />
					<Text className="text-sm text-gray-500">
						如有任何疑問，請聯繫：fish@fishot.com
					</Text>
				</Wrapper>
			</Body>
		</Html>
	);
}

OrderConfirmation.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	orderId: "abc12345-0000-0000-0000-000000000000",
	customerName: "測試客戶",
	items: [
		{ titleTranslated: "初音未來 1/7 模型", quantity: 2, unitPrice: 1500 },
		{ titleTranslated: "鬼滅之刃 煉獄模型", quantity: 1, unitPrice: 3200 },
	],
	totalAmount: 6200,
	notes: "請分開包裝",
};

export default OrderConfirmation;
