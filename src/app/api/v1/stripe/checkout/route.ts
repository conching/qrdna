import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { apiError, apiSuccess, unexpectedError } from "@/lib/api/errors";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "Authentication required", "UNAUTHORIZED");

    const body = (await request.json()) as { interval?: "month" | "year" };
    const priceId =
      body.interval === "year"
        ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID!
        : process.env.STRIPE_PRO_MONTHLY_PRICE_ID!;

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: profile?.stripe_customer_id ?? undefined,
      customer_email: profile?.stripe_customer_id ? undefined : user.email,
      metadata: { user_id: user.id },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return apiSuccess({ url: session.url });
  } catch (err) {
    return unexpectedError("stripe/checkout", err);
  }
}
