import Stripe from "npm:stripe@17.7.0";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-03-31.basil" });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const { name, email, amount } = await request.json();
    const cents = Math.round(Number(amount) * 100);
    if (!name || !/^\S+@\S+\.\S+$/.test(email || "") || !Number.isInteger(cents) || cents < 100 || cents > 1000000) return Response.json({ error: "Informations de don invalides." }, { status: 400, headers });
    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) throw new Error("SITE_URL n’est pas défini.");
    const session = await stripe.checkout.sessions.create({
      mode: "payment", customer_email: email, billing_address_collection: "auto",
      line_items: [{ price_data: { currency: "eur", tax_behavior: "exclusive", product_data: { name: "Don de test - Les Jeunes Aventuriers", tax_code: "txcd_10000000" }, unit_amount: cents }, quantity: 1 }],
      metadata: { donor_name: String(name).slice(0, 120), document_type: "test_confirmation" },
      success_url: `${siteUrl}/merci-don.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/don-annule.html`
    });
    return Response.json({ url: session.url }, { headers: { ...headers, "Content-Type": "application/json" } });
  } catch (error) { return Response.json({ error: error.message || "Erreur de paiement." }, { status: 500, headers }); }
});
