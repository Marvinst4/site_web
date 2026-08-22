const volunteerConfig = window.SUPABASE_CONFIG;
const volunteerForm = document.querySelector("#volunteer-form");
const volunteerMessage = document.querySelector("#volunteer-message");

function volunteerStatus(text, kind = "") {
  volunteerMessage.textContent = text;
  volunteerMessage.className = "form-note " + kind;
}

volunteerForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!volunteerConfig?.url || !volunteerConfig?.anonKey) return volunteerStatus("Le formulaire n’est pas encore configuré.", "error");
  const data = Object.fromEntries(new FormData(volunteerForm));
  if (data.website) return volunteerStatus("Merci, votre candidature a bien été envoyée.", "success");
  delete data.website;
  delete data.privacy;
  data.phone = String(data.phone || "").trim() || null;

  volunteerStatus("Envoi de votre candidature…");
  try {
    const response = await fetch(volunteerConfig.url.replace(/\/$/, "") + "/rest/v1/volunteer_applications", {
      method: "POST",
      headers: { apikey: volunteerConfig.anonKey, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || "Votre candidature n’a pas pu être envoyée. Réessayez dans quelques instants.");
    }
    volunteerForm.reset();
    volunteerStatus("Merci ! Votre candidature a bien été reçue. Nous vous recontacterons prochainement.", "success");
  } catch (error) {
    volunteerStatus(error.message, "error");
  }
});
