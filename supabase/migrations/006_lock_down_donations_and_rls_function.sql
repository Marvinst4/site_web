revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role;

revoke all on table public.donations from public, anon, authenticated;
grant select, insert, update, delete on table public.donations to service_role;

drop policy if exists "Les dons sont gérés uniquement par le serveur" on public.donations;
create policy "Les dons sont gérés uniquement par le serveur"
on public.donations for all to anon, authenticated
using (false)
with check (false);
