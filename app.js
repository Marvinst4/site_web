const starterActivities = [
  { title: "Une journée à la Cité des sciences", date: "2026-09-19", place: "Paris", spots: 18, category: "Culture" },
  { title: "Tous au Parc Astérix !", date: "2026-10-10", place: "Plailly", spots: 30, category: "Loisirs" },
  { title: "À la rencontre des animaux", date: "2026-10-24", place: "Parc zoologique de Paris", spots: 15, category: "Nature" }
];

const getActivities = () => JSON.parse(localStorage.getItem("petits-explorateurs-activities")) || starterActivities;
const saveActivities = (activities) => localStorage.setItem("petits-explorateurs-activities", JSON.stringify(activities));
const formatDate = (date) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));

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

function renderActivities() {
  const activities = getActivities();
  const list = document.querySelector("#activity-list");
  document.querySelector("#empty-state").hidden = activities.length !== 0;
  list.innerHTML = activities.map(activity => `
    <article class="activity-card">
      <span class="tag">${activity.category}</span>
      <h3>${activity.title}</h3>
      <div class="meta"><strong>${formatDate(activity.date)}</strong><br>${activity.place} · ${activity.spots} places disponibles</div>
    </article>`).join("");
}

const modal = document.querySelector("#form-modal");
const modalContent = document.querySelector("#modal-content");
document.querySelectorAll("[data-open-modal]").forEach(button => button.addEventListener("click", () => {
  const type = button.dataset.openModal;
  modalContent.innerHTML = type === "don" ? `
    <p class="eyebrow">Merci pour votre soutien</p><h2>Faire un don</h2>
    <p>Votre don permettra de financer des sorties, transports et goûters pour les enfants. Cette démonstration n’encaisse aucun paiement.</p>
    <form id="don-form"><label>Votre prénom<input required name="name" autocomplete="given-name" /></label><label>Votre adresse e-mail<input required type="email" name="email" autocomplete="email" /></label><label>Montant souhaité (€)<input required type="number" min="1" name="amount" value="20" /></label><button class="button">Je confirme mon intention de don <span>→</span></button></form>` : `
    <p class="eyebrow">Participer</p><h2>Inscrire un enfant</h2>
    <p>Nous vous recontacterons pour vérifier les modalités et finaliser l’inscription.</p>
    <form id="registration-form"><label>Nom du responsable<input required name="guardian" /></label><label>Adresse e-mail<input required type="email" name="email" /></label><label>Prénom de l’enfant<input required name="child" /></label><label>Activité souhaitée<select name="activity">${getActivities().map(a => `<option>${a.title}</option>`).join("")}</select></label><button class="button">Envoyer la demande <span>→</span></button></form>`;
  modal.showModal();
}));

document.querySelector(".admin-toggle").addEventListener("click", () => document.querySelector("#admin-modal").showModal());
document.querySelectorAll(".close").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }));

document.addEventListener("submit", async event => {
  if (event.target.id === "contact-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const subject = encodeURIComponent(`Message depuis Les Petits Explorateurs — ${data.name}`);
    const body = encodeURIComponent(`Nom : ${data.name}\nE-mail : ${data.email}\n\nMessage :\n${data.message}`);
    window.location.href = `mailto:st4ssx@gmail.com?subject=${subject}&body=${body}`;
    return;
  }
  if (event.target.id === "activity-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    data.spots = Number(data.spots);
    saveActivities([...getActivities(), data]);
    renderActivities(); event.target.reset(); event.target.closest("dialog").close();
  }
  if (["don-form", "registration-form"].includes(event.target.id)) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    if (event.target.id === "don-form") {
      const existing = JSON.parse(localStorage.getItem("petits-explorateurs-don-intentions")) || [];
      localStorage.setItem("petits-explorateurs-don-intentions", JSON.stringify([...existing, { ...data, createdAt: new Date().toISOString() }]));
      modalContent.innerHTML = `<p class="eyebrow">C’est enregistré</p><h2>Merci !</h2><p>Votre intention de don a bien été enregistrée. Nous vous contacterons très bientôt.</p><button class="button" onclick="document.querySelector('#form-modal').close()">Fermer</button>`;
      return;
    }
    try {
      const storage = await saveRegistration(data);
      const note = storage === "database" ? "Votre demande a été enregistrée." : "Votre demande est enregistrée sur cet appareil. Connectez Supabase avant la mise en ligne pour la recevoir dans votre base.";
      modalContent.innerHTML = `<p class="eyebrow">C’est enregistré</p><h2>Merci !</h2><p>${note} Nous vous contacterons très bientôt.</p><button class="button" onclick="document.querySelector('#form-modal').close()">Fermer</button>`;
    } catch (error) {
      modalContent.innerHTML = `<p class="eyebrow">Un problème est survenu</p><h2>La demande n’a pas été envoyée.</h2><p>Veuillez réessayer dans quelques instants ou nous contacter par e-mail.</p><a class="button" href="mailto:st4ssx@gmail.com">Nous écrire</a>`;
    }
  }
});

renderActivities();
