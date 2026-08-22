const starterActivities = [
  { title: "Une journée à la Cité des sciences", date: "2026-09-19", place: "Paris", spots: 18, category: "Culture" },
  { title: "Tous au Parc Astérix !", date: "2026-10-10", place: "Plailly", spots: 30, category: "Loisirs" },
  { title: "À la rencontre des animaux", date: "2026-10-24", place: "Parc zoologique de Paris", spots: 15, category: "Nature" }
];

let currentActivities = JSON.parse(localStorage.getItem("petits-explorateurs-activities")) || starterActivities;
const getActivities = () => currentActivities;
const formatDate = (date) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
const escapeHtml = (value) => String(value).replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));

async function saveRegistration(data) {
  const config = window.SUPABASE_CONFIG;
  if (!config?.url || !config?.anonKey) {
    const existing = JSON.parse(localStorage.getItem("petits-explorateurs-registrations")) || [];
    localStorage.setItem("petits-explorateurs-registrations", JSON.stringify([...existing, { ...data, createdAt: new Date().toISOString() }]));
    return "local";
  }

  const response = await fetch(`${config.url.replace(/\/$/, "")}/rest/v1/registrations`, {
    method: "POST",
    headers: {
      "apikey": config.anonKey,
      "Authorization": `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({
      guardian_name: data.guardian,
      email: data.email,
      child_first_name: data.child,
      activity: data.activity
    })
  });
  if (!response.ok) throw new Error("Erreur lors de l’enregistrement de la demande.");
  return "database";
}

async function beginDonationCheckout(data) {
  const supabase = window.SUPABASE_CONFIG;
  const stripe = window.STRIPE_CONFIG;
  if (!supabase?.url || !supabase?.anonKey || !stripe?.publishableKey) {
    throw new Error("Le paiement test n’est pas encore configuré.");
  }
  const response = await fetch(`${supabase.url.replace(/\/$/, "")}/functions/v1/create-donation-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": supabase.anonKey, "Authorization": `Bearer ${supabase.anonKey}` },
    body: JSON.stringify({ name: data.name, email: data.email, amount: Number(data.amount) })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.url) throw new Error(result.error || "Impossible de démarrer le paiement.");
  window.location.assign(result.url);
}

async function sendContactMessage(data) {
  const config = window.SUPABASE_CONFIG;
  if (!config?.url || !config?.anonKey) throw new Error("Le formulaire de contact n’est pas encore configuré.");
  const response = await fetch(`${config.url.replace(/\/$/, "")}/functions/v1/contact-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": config.anonKey, "Authorization": `Bearer ${config.anonKey}` },
    body: JSON.stringify({ name: data.name, email: data.email, subject: data.subject, message: data.message, company: data.company })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Impossible d’envoyer votre message pour le moment.");
}

function renderActivities() {
  const activities = getActivities();
  const list = document.querySelector("#activity-list");
  document.querySelector("#empty-state").hidden = activities.length !== 0;
  list.innerHTML = activities.map((activity, index) => `
    <article class="activity-card">
      <span class="tag">${escapeHtml(activity.category)}</span>
      <h3>${escapeHtml(activity.title)}</h3>
      <div class="meta"><strong>${formatDate(activity.date)}</strong><br>${escapeHtml(activity.place)} · ${activity.spots} places disponibles</div>
      <button class="activity-registration-button" type="button" data-register-activity="${index}">Inscrire un enfant <span>→</span></button>
    </article>`).join("");
}

async function loadPublishedActivities() {
  const config = window.SUPABASE_CONFIG;
  if (!config?.url || !config?.anonKey) return;
  try {
    const response = await fetch(`${config.url.replace(/\/$/, "")}/rest/v1/activities?select=title,date,place,spots,category&published=eq.true&order=date.asc`, { headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` } });
    if (!response.ok) throw new Error("Chargement impossible");
    const activities = await response.json();
    if (Array.isArray(activities)) {
      currentActivities = activities;
      localStorage.setItem("petits-explorateurs-activities", JSON.stringify(activities));
      renderActivities();
    }
  } catch { /* Les activités locales restent affichées tant que Supabase n'est pas configuré. */ }
}

const modal = document.querySelector("#form-modal");
const modalContent = document.querySelector("#modal-content");
function openFormModal(type, selectedActivity = "") {
  modalContent.innerHTML = type === "don" ? `
    <p class="eyebrow">Merci pour votre soutien</p><h2>Faire un don</h2>
    <p>Votre don permettra de financer des sorties, transports et goûters pour les enfants. Le paiement s’effectue dans l’environnement de test Stripe : aucun montant réel ne sera prélevé.</p>
    <form id="don-form"><label>Votre prénom<input required name="name" autocomplete="given-name" /></label><label>Votre adresse e-mail<input required type="email" name="email" autocomplete="email" /></label><label>Montant souhaité (€)<input required type="number" min="1" step="0.01" name="amount" value="20" /></label><button class="button">Tester le paiement sécurisé <span>→</span></button></form>` : `
    <p class="eyebrow">Participer</p><h2>Inscrire un enfant</h2>
    <p>Nous vous recontacterons pour vérifier les modalités et finaliser l’inscription.</p>
    <form id="registration-form"><label>Nom du responsable<input required name="guardian" /></label><label>Adresse e-mail<input required type="email" name="email" /></label><label>Prénom de l’enfant<input required name="child" /></label><label>Activité souhaitée<select name="activity">${getActivities().map(a => `<option${a.title === selectedActivity ? " selected" : ""}>${a.title}</option>`).join("")}</select></label><label class="privacy-check"><input required type="checkbox" name="privacy" /> <span>J’ai lu la <a href="confidentialite.html">politique de confidentialité</a> et j’accepte que ces données soient utilisées pour traiter cette demande.</span></label><button class="button">Envoyer la demande <span>→</span></button></form>`;
  modal.showModal();
}

document.querySelectorAll("[data-open-modal]").forEach(button => button.addEventListener("click", () => openFormModal(button.dataset.openModal)));
document.querySelector("#activity-list").addEventListener("click", event => {
  const button = event.target.closest("[data-register-activity]");
  if (!button) return;
  const activity = getActivities()[Number(button.dataset.registerActivity)];
  if (activity) openFormModal("inscription", activity.title);
});

document.querySelectorAll(".close").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }));

document.addEventListener("submit", async event => {
  if (event.target.id === "contact-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const form = event.target;
    const button = form.querySelector("button[type=submit]");
    const status = document.querySelector("#contact-form-status");
    button.disabled = true;
    status.textContent = "Envoi de votre message…";
    try {
      await sendContactMessage(data);
      form.reset();
      status.textContent = "Merci, votre message a bien été envoyé. Nous vous répondrons dès que possible.";
    } catch (error) {
      status.textContent = error.message || "Une erreur est survenue. Veuillez réessayer plus tard.";
    } finally {
      button.disabled = false;
    }
    return;
  }
  if (["don-form", "registration-form"].includes(event.target.id)) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    if (event.target.id === "don-form") {
      modalContent.innerHTML = `<p class="eyebrow">Paiement test</p><h2>Redirection sécurisée…</h2><p>Vous allez être redirigé vers Stripe. Utilisez une carte de test : 4242 4242 4242 4242, une date future et un CVC de trois chiffres.</p>`;
      try { await beginDonationCheckout(data); }
      catch (error) { modalContent.innerHTML = `<p class="eyebrow">Configuration requise</p><h2>Le paiement test n’est pas encore disponible.</h2><p>${error.message} Consultez docs/STRIPE_SETUP.md pour déployer les fonctions sécurisées.</p><button class="button" onclick="document.querySelector('#form-modal').close()">Fermer</button>`; }
      return;
    }
    try {
      const storage = await saveRegistration(data);
      const note = storage === "database" ? "Votre demande a été enregistrée." : "Votre demande est enregistrée sur cet appareil. Connectez Supabase avant la mise en ligne pour la recevoir dans votre base.";
      modalContent.innerHTML = `<p class="eyebrow">C’est enregistré</p><h2>Merci !</h2><p>${note} Nous vous contacterons très bientôt.</p><button class="button" onclick="document.querySelector('#form-modal').close()">Fermer</button>`;
    } catch (error) {
      modalContent.innerHTML = `<p class="eyebrow">Un problème est survenu</p><h2>La demande n’a pas été envoyée.</h2><p>Veuillez réessayer dans quelques instants ou nous contacter par e-mail.</p><a class="button" href="mailto:infos@lesjeunesexplorateurs.fr">Nous écrire</a>`;
    }
  }
});

renderActivities();
loadPublishedActivities();

if (new URLSearchParams(window.location.search).get("inscription") === "1") {
  window.history.replaceState({}, "", "index.html#agir");
  openFormModal("inscription");
}
