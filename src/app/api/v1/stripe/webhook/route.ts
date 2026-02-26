import { stripe } from "@/lib/stripe/client";
import { tierFromStripeStatus } from "@/lib/stripe/tier";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Stripe requires the raw body for signature verification.
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return Response.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const customerId = session.customer as string;
      if (!userId) break;
      await supabase
        .from("profiles")
        .update({ tier: "pro", stripe_customer_id: customerId })
        .eq("id", userId);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const newTier = tierFromStripeStatus(sub.status);
      await supabase
        .from("profiles")
        .update({ tier: newTier })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await supabase
        .from("profiles")
        .update({ tier: "free" })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return Response.json({ received: true });
}
