import { markOrderPaidByStripeSession } from "@repo/database";
import { getStripeClient } from "@repo/payments";

export async function POST(req: Request) {
	const signature = req.headers.get("stripe-signature");
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!signature || !webhookSecret) {
		return new Response("Missing webhook signature or secret", { status: 400 });
	}

	const stripe = getStripeClient();
	const rawBody = await req.text();

	let event: Awaited<ReturnType<typeof stripe.webhooks.constructEventAsync>>;
	try {
		event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
	} catch (error) {
		console.error("[stripe webhook] signature verify failed", error);
		return new Response("Invalid signature", { status: 400 });
	}

	if (event.type === "checkout.session.completed") {
		const session = event.data.object as { id?: string };
		if (session.id) {
			await markOrderPaidByStripeSession(session.id);
		}
	}

	return new Response("ok", { status: 200 });
}
