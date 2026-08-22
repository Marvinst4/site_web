import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-03-31.basil" });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
// Les polices PDF standard ne prennent pas en charge l'espace fine insécable
// ajouté par Intl pour les montants français (ex. « 10 € »). Un formatage
// explicite évite donc que la génération de la confirmation échoue.
const euro = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} EUR`;
const asBase64 = (bytes: Uint8Array) => btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(""));

async function createPdf(number: string, donorName: string, amount: number) {
  const pdf = await PDFDocument.create(); const page = pdf.addPage([595, 842]); const font = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const write = (value: string, x: number, y: number, size = 12, strong = false, color = rgb(0.09, 0.23, 0.22)) => page.drawText(value, { x, y, size, font: strong ? bold : font, color });
  page.drawRectangle({ x: 0, y: 780, width: 595, height: 62, color: rgb(0.09, 0.23, 0.22) });
  write("Les Jeunes Explorateurs", 45, 805, 18, true, rgb(1, 0.98, 0.94)); write("CONFIRMATION DE DON - TEST", 45, 745, 21, true); write("Document de demonstration - sans valeur fiscale", 45, 720, 11, false, rgb(0.84, 0.36, 0.28));
  write(`Reference : ${number}`, 45, 665, 12, true); write(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 45, 640); write("Donateur", 45, 585, 13, true); write(donorName, 45, 560); write("Montant du don", 365, 585, 13, true); write(euro(amount), 365, 560, 20, true, rgb(0.84, 0.36, 0.28));
  page.drawLine({ start: { x: 45, y: 520 }, end: { x: 550, y: 520 }, thickness: 1, color: rgb(0.85, 0.88, 0.82) }); write("Merci de soutenir l’accès des enfants à la culture, aux loisirs et aux découvertes.", 45, 480, 12); write("Ce document est genere en environnement Stripe test. Il ne constitue pas un recu fiscal.", 45, 82, 9, false, rgb(0.35, 0.44, 0.42));
  return pdf.save();
}

async function sendEmail(to: string, pdf: Uint8Array, number: string) {
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: Deno.env.get("EMAIL_FROM"), to: [to], bcc: ["infos@lesjeunesexplorateurs.fr"], subject: "Votre confirmation de don - Les Jeunes Explorateurs", html: `<p>Merci pour votre soutien.</p><p>Votre confirmation de don de test, sans valeur fiscale, est jointe à cet e-mail.</p><p>Référence : <strong>${number}</strong></p>`, attachments: [{ filename: `${number}.pdf`, content: asBase64(pdf) }] }) });
  if (!response.ok) throw new Error(`Envoi e-mail impossible : ${await response.text()}`);
}

Deno.serve(async (request) => {
  const signature = request.headers.get("stripe-signature");
  try {
    if (!signature) return new Response("Signature manquante", { status: 400 });
    const event = await stripe.webhooks.constructEventAsync(await request.text(), signature, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
    if (event.type !== "checkout.session.completed") return Response.json({ received: true });
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") return Response.json({ received: true });
    const existing = await admin.from("donations").select("confirmation_number, donor_email, receipt_path").eq("stripe_checkout_session_id", session.id).maybeSingle();
    // Un premier essai peut avoir créé le PDF et le don, puis échoué uniquement
    // lors de l'envoi e-mail (p. ex. domaine Resend en attente de validation).
    // Lors d'un renvoi Stripe, on réutilise alors le PDF déjà stocké.
    if (existing.data) {
      const receipt = await admin.storage.from("donation-confirmations").download(existing.data.receipt_path);
      if (receipt.error) throw receipt.error;
      await sendEmail(existing.data.donor_email, new Uint8Array(await receipt.data.arrayBuffer()), existing.data.confirmation_number);
      return Response.json({ received: true });
    }
    const number = `TEST-${new Date().getFullYear()}-${session.id.slice(-8).toUpperCase()}`; const amount = session.amount_total || 0; const donorName = session.metadata?.donor_name || "Donateur"; const donorEmail = session.customer_details?.email || session.customer_email;
    if (!donorEmail) throw new Error("E-mail donateur manquant.");
    const pdf = await createPdf(number, donorName, amount); const receiptPath = `${number}.pdf`;
    const upload = await admin.storage.from("donation-confirmations").upload(receiptPath, pdf, { contentType: "application/pdf", upsert: false }); if (upload.error) throw upload.error;
    const insert = await admin.from("donations").insert({ stripe_checkout_session_id: session.id, donor_name: donorName, donor_email: donorEmail, amount_cents: amount, confirmation_number: number, receipt_path: receiptPath }); if (insert.error) throw insert.error;
    await sendEmail(donorEmail, pdf, number); return Response.json({ received: true });
  } catch (error) { return new Response(error.message || "Erreur webhook", { status: 400 }); }
});
