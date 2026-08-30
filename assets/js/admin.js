const config = window.SUPABASE_CONFIG;
const loginPanel = document.querySelector("#login-panel");
const dashboardPanel = document.querySelector("#dashboard-panel");
const loginMessage = document.querySelector("#login-message");
const activityMessage = document.querySelector("#activity-message");
const activityForm = document.querySelector("#activity-admin-form");
const activityList = document.querySelector("#admin-activity-list");
const activityFormTitle = document.querySelector("#activity-form-title");
const activitySubmitButton = document.querySelector("#activity-submit-button");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const activitiesCount = document.querySelector("#activities-count");
const volunteerMessage = document.querySelector("#volunteer-admin-message");
const volunteerForm = document.querySelector("#volunteer-admin-form");
const volunteerList = document.querySelector("#admin-volunteer-list");
const volunteerFormTitle = document.querySelector("#volunteer-form-title");
const volunteerSubmitButton = document.querySelector("#volunteer-submit-button");
const cancelVolunteerEditButton = document.querySelector("#cancel-volunteer-edit-button");
const volunteersCount = document.querySelector("#volunteers-count");

let accessToken = sessionStorage.getItem("admin-access-token");
let activities = [];
let editingActivityId = null;
let volunteers = [];
let editingVolunteerId = null;

function showDashboard() { loginPanel.hidden = true; dashboardPanel.hidden = false; }
function showLogin() { dashboardPanel.hidden = true; loginPanel.hidden = false; }
function message(element, text, kind = "") { element.textContent = text; element.className = "admin-message " + kind; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }

function formatDate(value) {
  if (!value) return "Date à préciser";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value + "T12:00:00"));
}

function resetActivityForm() {
  editingActivityId = null;
  activityForm.reset();
  activityForm.elements.spots.value = 20;
  activityForm.elements.published.checked = true;
  activityFormTitle.textContent = "Ajouter une activité";
  activitySubmitButton.innerHTML = "Publier l’activité <span>→</span>";
  cancelEditButton.hidden = true;
}

function resetVolunteerForm() {
  editingVolunteerId = null;
  volunteerForm.reset();
  volunteerFormTitle.textContent = "Ajouter un bénévole";
  volunteerSubmitButton.innerHTML = "Ajouter le bénévole <span>→</span>";
  cancelVolunteerEditButton.hidden = true;
}

function setEditingVolunteer(volunteer) {
  editingVolunteerId = volunteer.id;
  volunteerForm.elements.first_name.value = volunteer.first_name;
  volunteerForm.elements.last_name.value = volunteer.last_name;
  volunteerForm.elements.email.value = volunteer.email;
  volunteerForm.elements.phone.value = volunteer.phone;
  volunteerForm.elements.age.value = volunteer.age;
  volunteerForm.elements.city.value = volunteer.city;
  volunteerFormTitle.textContent = "Modifier le bénévole";
  volunteerSubmitButton.innerHTML = "Enregistrer les modifications <span>→</span>";
  cancelVolunteerEditButton.hidden = false;
  volunteerForm.scrollIntoView({ behavior: "smooth", block: "start" });
  volunteerForm.elements.first_name.focus();
}

function setEditingActivity(activity) {
  editingActivityId = activity.id;
  activityForm.elements.title.value = activity.title;
  activityForm.elements.date.value = activity.date;
  activityForm.elements.place.value = activity.place;
  activityForm.elements.spots.value = activity.spots;
  activityForm.elements.category.value = activity.category;
  activityForm.elements.published.checked = activity.published;
  activityFormTitle.textContent = "Modifier l’activité";
  activitySubmitButton.innerHTML = "Enregistrer les modifications <span>→</span>";
  cancelEditButton.hidden = false;
  activityForm.scrollIntoView({ behavior: "smooth", block: "start" });
  activityForm.elements.title.focus();
}

function renderActivities() {
  activitiesCount.textContent = activities.length + " activité" + (activities.length > 1 ? "s" : "");
  if (!activities.length) {
    activityList.innerHTML = '<p class="admin-empty-state">Aucune activité pour le moment. Ajoutez la première sortie ci-dessus.</p>';
    return;
  }

  activityList.innerHTML = activities.map(activity => {
    const status = activity.published ? "is-published" : "is-hidden";
    const statusText = activity.published ? "Publiée" : "Non publiée";
    return '<article class="admin-activity-item"><div class="admin-activity-content"><div class="admin-activity-topline"><span class="admin-status ' + status + '">' + statusText + '</span><span>' + escapeHtml(activity.category) + '</span></div><h3>' + escapeHtml(activity.title) + '</h3><p>' + formatDate(activity.date) + ' · ' + escapeHtml(activity.place) + ' · ' + Number(activity.spots) + ' places</p></div><div class="admin-activity-actions"><button class="admin-action-button" type="button" data-edit-id="' + activity.id + '">Modifier</button><button class="admin-action-button admin-delete-button" type="button" data-delete-id="' + activity.id + '">Supprimer</button></div></article>';
  }).join("");
}

function renderVolunteers() {
  volunteersCount.textContent = volunteers.length + " bénévole" + (volunteers.length > 1 ? "s" : "");
  if (!volunteers.length) {
    volunteerList.innerHTML = '<p class="admin-empty-state">Aucun bénévole pour le moment. Ajoutez le premier membre de votre équipe ci-dessus.</p>';
    return;
  }

  volunteerList.innerHTML = volunteers.map(volunteer => {
    const fullName = escapeHtml(volunteer.first_name) + " " + escapeHtml(volunteer.last_name);
    return '<article class="admin-volunteer-item"><div class="admin-volunteer-content"><div class="admin-volunteer-topline"><span>' + fullName + '</span><span>' + Number(volunteer.age) + ' ans</span></div><p><a href="mailto:' + escapeHtml(volunteer.email) + '">' + escapeHtml(volunteer.email) + '</a> · <a href="tel:' + escapeHtml(volunteer.phone) + '">' + escapeHtml(volunteer.phone) + '</a></p><p>' + escapeHtml(volunteer.city) + '</p></div><div class="admin-volunteer-actions"><button class="admin-action-button" type="button" data-edit-volunteer-id="' + volunteer.id + '">Modifier</button><button class="admin-action-button admin-delete-button" type="button" data-delete-volunteer-id="' + volunteer.id + '">Supprimer</button></div></article>';
  }).join("");
}

async function api(path, options = {}) {
  if (!config?.url || !config?.anonKey) throw new Error("Supabase n’est pas configuré.");
  const response = await fetch(config.url.replace(/\/$/, "") + path, {
    ...options,
    headers: { apikey: config.anonKey, Authorization: "Bearer " + accessToken, "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(result?.message || result?.error_description || "Cette action n’a pas pu être réalisée.");
    error.status = response.status;
    throw error;
  }
  return result;
}

function handleSessionError(error) {
  if (error.status !== 401 && error.status !== 403) return false;
  sessionStorage.removeItem("admin-access-token");
  accessToken = null;
  showLogin();
  message(loginMessage, "Votre session a expiré ou ce compte n’est pas autorisé à gérer les activités et les bénévoles.", "error");
  return true;
}

async function loadActivities() {
  activityList.innerHTML = '<p class="admin-empty-state">Chargement des activités…</p>';
  try {
    activities = await api("/rest/v1/activities?select=id,title,date,place,spots,category,published&order=date.asc");
    renderActivities();
  } catch (error) {
    if (!handleSessionError(error)) activityList.innerHTML = '<p class="admin-empty-state admin-error-text">' + escapeHtml(error.message) + "</p>";
  }
}

async function loadVolunteers() {
  volunteerList.innerHTML = '<p class="admin-empty-state">Chargement des bénévoles…</p>';
  try {
    volunteers = await api("/rest/v1/volunteers?select=id,first_name,last_name,email,phone,age,city,created_at&order=last_name.asc,first_name.asc");
    renderVolunteers();
  } catch (error) {
    if (!handleSessionError(error)) volunteerList.innerHTML = '<p class="admin-empty-state admin-error-text">' + escapeHtml(error.message) + "</p>";
  }
}

if (accessToken) { showDashboard(); loadActivities(); loadVolunteers(); }

document.querySelector("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!config?.url || !config?.anonKey) return message(loginMessage, "Supabase n’est pas configuré.", "error");
  const data = Object.fromEntries(new FormData(event.target));
  message(loginMessage, "Connexion en cours…");
  try {
    const response = await fetch(config.url.replace(/\/$/, "") + "/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: config.anonKey, "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok || !result.access_token) throw new Error(result.error_description || "Identifiants incorrects.");
    accessToken = result.access_token;
    sessionStorage.setItem("admin-access-token", accessToken);
    event.target.reset();
    showDashboard();
    loadActivities();
    loadVolunteers();
  } catch (error) { message(loginMessage, error.message, "error"); }
});

activityForm.addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(activityForm));
  data.spots = Number(data.spots);
  data.published = activityForm.elements.published.checked;
  const editing = Boolean(editingActivityId);
  message(activityMessage, editing ? "Enregistrement en cours…" : "Publication en cours…");
  try {
    const path = editing ? "/rest/v1/activities?id=eq." + encodeURIComponent(editingActivityId) : "/rest/v1/activities";
    await api(path, { method: editing ? "PATCH" : "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(data) });
    resetActivityForm();
    message(activityMessage, editing ? "Les modifications sont enregistrées." : "L’activité est enregistrée.", "success");
    loadActivities();
  } catch (error) {
    if (!handleSessionError(error)) message(activityMessage, error.message, "error");
  }
});

activityList.addEventListener("click", async event => {
  const editId = event.target.closest("[data-edit-id]")?.dataset.editId;
  const deleteId = event.target.closest("[data-delete-id]")?.dataset.deleteId;
  if (editId) {
    const activity = activities.find(item => item.id === editId);
    if (activity) setEditingActivity(activity);
    return;
  }
  if (!deleteId) return;
  const activity = activities.find(item => item.id === deleteId);
  if (!activity || !window.confirm("Supprimer définitivement l’activité « " + activity.title + " » ?")) return;
  message(activityMessage, "Suppression en cours…");
  try {
    await api("/rest/v1/activities?id=eq." + encodeURIComponent(deleteId), { method: "DELETE", headers: { Prefer: "return=minimal" } });
    if (editingActivityId === deleteId) resetActivityForm();
    message(activityMessage, "L’activité a été supprimée.", "success");
    loadActivities();
  } catch (error) {
    if (!handleSessionError(error)) message(activityMessage, error.message, "error");
  }
});

cancelEditButton.addEventListener("click", () => { resetActivityForm(); message(activityMessage, "Modification annulée."); });

volunteerForm.addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(volunteerForm));
  data.age = Number(data.age);
  const editing = Boolean(editingVolunteerId);
  message(volunteerMessage, editing ? "Enregistrement en cours…" : "Ajout en cours…");
  try {
    const path = editing ? "/rest/v1/volunteers?id=eq." + encodeURIComponent(editingVolunteerId) : "/rest/v1/volunteers";
    await api(path, { method: editing ? "PATCH" : "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(data) });
    resetVolunteerForm();
    message(volunteerMessage, editing ? "Les modifications sont enregistrées." : "Le bénévole est enregistré.", "success");
    loadVolunteers();
  } catch (error) {
    if (!handleSessionError(error)) message(volunteerMessage, error.message, "error");
  }
});

volunteerList.addEventListener("click", async event => {
  const editId = event.target.closest("[data-edit-volunteer-id]")?.dataset.editVolunteerId;
  const deleteId = event.target.closest("[data-delete-volunteer-id]")?.dataset.deleteVolunteerId;
  if (editId) {
    const volunteer = volunteers.find(item => item.id === editId);
    if (volunteer) setEditingVolunteer(volunteer);
    return;
  }
  if (!deleteId) return;
  const volunteer = volunteers.find(item => item.id === deleteId);
  if (!volunteer || !window.confirm("Supprimer définitivement le bénévole « " + volunteer.first_name + " " + volunteer.last_name + " » ?")) return;
  message(volunteerMessage, "Suppression en cours…");
  try {
    await api("/rest/v1/volunteers?id=eq." + encodeURIComponent(deleteId), { method: "DELETE", headers: { Prefer: "return=minimal" } });
    if (editingVolunteerId === deleteId) resetVolunteerForm();
    message(volunteerMessage, "Le bénévole a été supprimé.", "success");
    loadVolunteers();
  } catch (error) {
    if (!handleSessionError(error)) message(volunteerMessage, error.message, "error");
  }
});

cancelVolunteerEditButton.addEventListener("click", () => { resetVolunteerForm(); message(volunteerMessage, "Modification annulée."); });
document.querySelector("#logout-button").addEventListener("click", () => { sessionStorage.removeItem("admin-access-token"); accessToken = null; resetActivityForm(); resetVolunteerForm(); showLogin(); message(loginMessage, "Vous êtes déconnecté."); });
