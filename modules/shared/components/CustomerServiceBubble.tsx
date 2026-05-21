"use client";

import { MessageCircleIcon } from "lucide-react";

export function CustomerServiceBubble() {
	const url = process.env.NEXT_PUBLIC_CUSTOMER_SERVICE_URL;
	if (!url) return null;

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#e9739a] shadow-lg transition-opacity hover:opacity-90"
			title="客服"
		>
			<MessageCircleIcon size={28} color="white" />
		</a>
	);
}
