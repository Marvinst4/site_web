# Connecter les inscriptions à Supabase

1. Créez un projet sur [Supabase](https://supabase.com).
2. Dans **SQL Editor**, exécutez le script ci-dessous.
3. Dans **Project Settings > API**, copiez l’URL du projet et la clé `anon` (jamais `service_role`) dans `supabase-config.js`.
4. Publiez ensuite l’ensemble du dossier sur votre hébergeur. Les inscriptions seront alors enregistrées dans la table `registrations`.

```sql
create table public.registrations (
  id bigint generated always as identity primary key,
  guardian_name text not null check (char_length(guardian_name) between 2 and 100),
  email text not null check (char_length(email) between 5 and 254),
  child_first_name text not null check (char_length(child_first_name) between 1 and 80),
  activity text not null check (char_length(activity) between 2 and 160),
  created_at timestamptz not null default now()
);

alter table public.registrations enable row level security;

create policy "Les visiteurs peuvent créer une demande"
on public.registrations
for insert
to anon
with check (true);
```

Les visiteurs ne peuvent insérer que des demandes : ils ne peuvent ni lire, ni modifier, ni supprimer les données des autres personnes. Pour consulter les inscriptions, ouvrez **Table Editor > registrations** dans votre tableau de bord Supabase.

Les données concernent des enfants : ne collectez que le minimum nécessaire et prévoyez une mention d’information/confidentialité avant la mise en ligne publique.

## Activités et accès administrateur

Exécutez également `supabase/migrations/003_activities_admin.sql`, puis `supabase/migrations/004_activities_admin_crud.sql` et `supabase/migrations/005_optimize_activities_admin_rls.sql`, dans le SQL Editor. Puis, dans **Authentication > Users**, créez manuellement l’utilisateur `infos@lesjeunesexplorateurs.fr` avec un mot de passe fort. Désactivez les inscriptions publiques dans **Authentication > Providers > Email** : seul cet utilisateur pourra gérer les activités depuis `admin.html`.
