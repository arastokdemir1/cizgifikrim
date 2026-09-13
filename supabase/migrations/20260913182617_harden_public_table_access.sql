-- Least-privilege public Data API access for CizgiFikrim.
-- This migration changes privileges and RLS policies only; it does not alter or delete application data.

revoke all privileges on table public.projects from anon, authenticated;
grant select on table public.projects to anon;

revoke all privileges on table public.contact_messages from anon, authenticated;
grant insert (name, email, subject, message) on table public.contact_messages to anon;

drop policy if exists contact_public_insert on public.contact_messages;

create policy contact_public_insert
on public.contact_messages
for insert
to anon
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
