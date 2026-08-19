const config = window.SUPABASE_CONFIG;
const loginPanel = document.querySelector("#login-panel");
const dashboardPanel = document.querySelector("#dashboard-panel");
const loginMessage = document.querySelector("#login-message");
const activityMessage = document.querySelector("#activity-message");
let accessToken = sessionStorage.getItem("admin-access-token");

function showDashboard() { loginPanel.hidden = true; dashboardPanel.hidden = false; }
function showLogin() { dashboardPanel.hidden = true; loginPanel.hidden = false; }
function message(element, text, kind = "") { element.textContent = text; element.className = `admin-message ${kind}`; }

if (accessToken) showDashboard();

document.querySelector("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!config?.url || !config?.anonKey) return message(loginMessage, "Supabase n’est pas configuré.", "error");
  const data = Object.fromEntries(new FormData(event.target));
  message(loginMessage, "Connexion en cours…");
  try {
    const response = await fetch(`${config.url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: config.anonKey, "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok || !result.access_token) throw new Error(result.error_description || "Identifiants incorrects.");
    accessToken = result.access_token;
    sessionStorage.setItem("admin-access-token", accessToken);
    event.target.reset(); showDashboard();
  } catch (error) { message(loginMessage, error.message, "error"); }
});

document.querySelector("#activity-admin-form").addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target)); data.spots = Number(data.spots);
  message(activityMessage, "Publication en cours…");
  try {
    const response = await fetch(`${config.url.replace(/\/$/, "")}/rest/v1/activities`, { method: "POST", headers: { apikey: config.anonKey, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(data) });
    if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.message || "Publication refusée. Vérifiez que vous utilisez l’adresse administrateur."); }
    event.target.reset(); event.target.elements.spots.value = 20; message(activityMessage, "L’activité est publiée et visible sur le site.", "success");
  } catch (error) { message(activityMessage, error.message, "error"); }
});

document.querySelector("#logout-button").addEventListener("click", () => { sessionStorage.removeItem("admin-access-token"); accessToken = null; showLogin(); message(loginMessage, "Vous êtes déconnecté."); });
