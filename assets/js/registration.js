(() => {
  const form = document.querySelector("#registration-form");
  const activitySelect = form?.querySelector("[name=activity]");
  const status = document.querySelector("#registration-message");
  if (!form || !activitySelect || !status) return;

  const requestedActivity = new URLSearchParams(window.location.search).get("activity");
  const addActivityOption = (title, selected = false) => {
    if ([...activitySelect.options].some(option => option.value === title)) {
      if (selected) activitySelect.value = title;
      return;
    }
    const option = document.createElement("option");
    option.value = title;
    option.textContent = title;
    option.selected = selected;
    activitySelect.append(option);
  };

  if (requestedActivity) addActivityOption(requestedActivity, true);

  const config = window.SUPABASE_CONFIG;
  if (config?.url && config?.anonKey) {
    fetch(`${config.url.replace(/\/$/, "")}/rest/v1/activities?select=title,date&published=eq.true&order=date.asc`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` }
    }).then(response => response.ok ? response.json() : []).then(activities => {
      if (!Array.isArray(activities)) return;
      activities.forEach(activity => addActivityOption(activity.title, activity.title === requestedActivity));
    }).catch(() => {});
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    const data = Object.fromEntries(new FormData(form));
    button.disabled = true;
    status.className = "form-note";
    status.textContent = "Envoi de votre demande…";

    try {
      if (!config?.url || !config?.anonKey) throw new Error("Le formulaire n’est pas encore configuré.");
      const response = await fetch(`${config.url.replace(/\/$/, "")}/rest/v1/registrations`, {
        method: "POST",
        headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ guardian_name: data.guardian, email: data.email, child_first_name: data.child, activity: data.activity })
      });
      if (!response.ok) throw new Error("Impossible d’enregistrer votre demande.");
      form.reset();
      status.className = "form-note success";
      status.textContent = "Merci, votre demande a bien été envoyée. Nous vous répondrons généralement sous 7 jours ouvrés.";
    } catch (error) {
      status.className = "form-note error";
      status.textContent = `${error.message} Vous pouvez aussi nous écrire à infos@lesjeunesexplorateurs.fr.`;
    } finally {
      button.disabled = false;
    }
  });
})();
