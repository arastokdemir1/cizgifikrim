-- Correct the public contact insert validator.
-- The policy remains insert-only for anon and does not alter application data.

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
