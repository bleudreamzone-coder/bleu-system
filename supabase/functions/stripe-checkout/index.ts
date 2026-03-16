import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id, email, price_id, success_url, cancel_url } = await req.json();

    if (!STRIPE_SECRET_KEY) throw new Error("Stripe key not configured");

    // Create Stripe checkout session
    const params = new URLSearchParams({
      "mode": "subscription",
      "line_items[0][price]": price_id || "price_1TBPtAK4cATmIFboFVb9m0QN",
      "line_items[0][quantity]": "1",
      "success_url": success_url || "https://bleu.live?citizen=1",
      "cancel_url": cancel_url || "https://bleu.live",
      "customer_email": email || "",
      "metadata[user_id]": user_id || "",
      "metadata[platform]": "bleu_live",
      "subscription_data[metadata][user_id]": user_id || "",
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Stripe error");
    }

    const session = await res.json();

    return new Response(
      JSON.stringify({
        session_id: session.id,
        checkout_url: session.url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
