const allowedOrigins = new Set([
  "https://lesjeunesexplorateurs.fr",
  "https://www.lesjeunesexplorateurs.fr",
  "https://marvinst4.github.io"
]);

const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!));

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "https://lesjeunesexplorateurs.fr",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function response(body: Record<string, string | boolean>, status: number, origin: string | null) {
  return Response.json(body, { status, headers: corsHeaders(origin) });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return response({ error: "Méthode non autorisée." }, 405, origin);
  if (!origin || !allowedOrigins.has(origin)) return response({ error: "Origine non autorisée." }, 403, origin);

  try {
    const data = await request.json();
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const subject = String(data.subject || "").trim();
    const message = String(data.message || "").trim();
    const honeypot = String(data.company || "").trim();

    if (honeypot) return response({ ok: true }, 200, origin);
    if (name.length < 2 || name.length > 120 || !isEmail(email) || email.length > 254 || subject.length < 2 || subject.length > 150 || message.length < 10 || message.length > 4000) {
      return response({ error: "Veuillez vérifier les informations saisies." }, 400, origin);
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM"),
        to: ["infos@lesjeunesexplorateurs.fr"],
        reply_to: email,
        subject: `[Contact] ${subject}`,
        text: `Nouveau message depuis le site\n\nNom : ${name}\nE-mail : ${email}\nObjet : ${subject}\n\nMessage :\n${message}`,
        html: `<h2>Nouveau message depuis le site</h2><p><strong>Nom :</strong> ${escapeHtml(name)}<br><strong>E-mail :</strong> ${escapeHtml(email)}<br><strong>Objet :</strong> ${escapeHtml(subject)}</p><p><strong>Message :</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`
      })
    });

    if (!resendResponse.ok) {
      console.error("Envoi contact impossible", await resendResponse.text());
      throw new Error("Envoi impossible");
    }
    return response({ ok: true }, 200, origin);
  } catch (error) {
    console.error("Erreur formulaire contact", error);
    return response({ error: "Impossible d’envoyer votre message pour le moment." }, 500, origin);
  }
});
