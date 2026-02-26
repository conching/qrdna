import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { apiError, apiSuccess } from "@/lib/api/errors";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "Authentication required", "UNAUTHORIZED");

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return apiError(400, "No billing account found", "NO_CUSTOMER");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return apiSuccess({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
