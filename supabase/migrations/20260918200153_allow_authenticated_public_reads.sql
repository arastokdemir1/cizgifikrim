-- Giriş yapmış kullanıcılar (authenticated rolü) da herkese açık katalogu
-- okuyabilmeli ve iletişim formunu gönderebilmeli. Önceden bu izinler yalnızca
-- anon rolündeydi; oturum açan biri katalogda "veri alınamadı" görüyordu.
-- Yalnızca yetki/politika değişir; veri değişmez. Form doğrulaması aynen korunur.

grant select on table public.projects to authenticated;
drop policy if exists projects_public_read on public.projects;
create policy projects_public_read
on public.projects
for select
to anon, authenticated
using (true);

grant insert (name, email, subject, message) on table public.contact_messages to authenticated;
drop policy if exists contact_public_insert on public.contact_messages;
create policy contact_public_insert
on public.contact_messages
for insert
to anon, authenticated
with check (
  name is not null
  and char_length(btrim(name)) between 1 and 120
  and email is not null
  and char_length(email) between 3 and 254
  and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  and subject is not null
  and char_length(btrim(subject)) between 1 and 200
  and (message is null or char_length(message) <= 5000)
);
