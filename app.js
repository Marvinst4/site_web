const starterActivities = [
  { title: "Une journée à la Cité des sciences", date: "2026-09-19", place: "Paris", spots: 18, category: "Culture" },
  { title: "Tous au Parc Astérix !", date: "2026-10-10", place: "Plailly", spots: 30, category: "Loisirs" },
  { title: "À la rencontre des animaux", date: "2026-10-24", place: "Parc zoologique de Paris", spots: 15, category: "Nature" }
];

const getActivities = () => JSON.parse(localStorage.getItem("petits-explorateurs-activities")) || starterActivities;
const saveActivities = (activities) => localStorage.setItem("petits-explorateurs-activities", JSON.stringify(activities));
const formatDate = (date) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));

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

document.addEventListener("submit", event => {
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
    const key = event.target.id === "don-form" ? "petits-explorateurs-don-intentions" : "petits-explorateurs-registrations";
    const existing = JSON.parse(localStorage.getItem(key)) || [];
    localStorage.setItem(key, JSON.stringify([...existing, { ...data, createdAt: new Date().toISOString() }]));
    modalContent.innerHTML = `<p class="eyebrow">C’est enregistré</p><h2>Merci !</h2><p>${event.target.id === "don-form" ? "Votre intention de don a bien été enregistrée." : "Votre demande d’inscription a bien été enregistrée."} Nous vous contacterons très bientôt.</p><button class="button" onclick="document.querySelector('#form-modal').close()">Fermer</button>`;
  }
});

renderActivities();
