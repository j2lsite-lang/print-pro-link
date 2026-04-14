import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { orderId, amount, customerEmail, description, items } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Amount is required and must be positive" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build line items description
    const itemDescription = description || 
      (items?.length 
        ? items.map((i: any) => `${i.productName} x${i.copies || 1}`).join(", ")
        : "Commande J2L Print");

    // Create a Stripe Checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(amount * 100), // Convert EUR to cents
            product_data: {
              name: `Commande J2L Print${orderId ? ` #${orderId.slice(0, 8)}` : ""}`,
              description: itemDescription.slice(0, 500),
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id: orderId || "",
        source: "j2l-print",
      },
      success_url: `${req.headers.get("origin") || "https://print-pro-link.lovable.app"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin") || "https://print-pro-link.lovable.app"}/cart`,
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[create-payment-link] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
