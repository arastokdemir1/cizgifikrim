-- Müşteri/proje portalı temeli.
-- clients: her auth.users kaydına 1:1 eşlenen profil satırı, signup'ta otomatik oluşur.
-- engagements: bir müşterinin bizimle olan somut proje/talebi (public.projects'ten farklı —
--   o bizim kendi ürün portföyümüz, bu ise müşteri bazlı iş takibi).
-- engagement_messages: portal içi mesajlaşma (müşteri <-> ekip).
-- Yazma yetkisi: müşteri sadece kendi profilini günceller ve kendi engagement'ına mesaj
--   ekler ('client' olarak); engagement oluşturma/durum güncelleme ve 'team' mesajları
--   yalnızca service-role (biz) tarafından yapılır — anon/authenticated bunu yapamaz.

create table if not exists public.clients (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy clients_select_own on public.clients
  for select to authenticated
  using (auth.uid() = id);

create policy clients_update_own on public.clients
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Yeni kullanıcı kaydolunca otomatik bir clients satırı oluştur.
create or replace function public.handle_new_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.clients (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_client();

create table if not exists public.engagements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  status text not null default 'intake' check (status in ('intake', 'in_progress', 'review', 'delivered', 'on_hold')),
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.engagements enable row level security;

create policy engagements_select_own on public.engagements
  for select to authenticated
  using (client_id = auth.uid());

create table if not exists public.engagement_messages (
  id bigint generated always as identity primary key,
  engagement_id uuid not null references public.engagements(id) on delete cascade,
  sender text not null check (sender in ('client', 'team')),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

alter table public.engagement_messages enable row level security;

create policy engagement_messages_select_own on public.engagement_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.engagements e
      where e.id = engagement_messages.engagement_id
      and e.client_id = auth.uid()
    )
  );

create policy engagement_messages_insert_own on public.engagement_messages
  for insert to authenticated
  with check (
    sender = 'client'
    and exists (
      select 1 from public.engagements e
      where e.id = engagement_messages.engagement_id
      and e.client_id = auth.uid()
    )
  );

create index if not exists engagement_messages_engagement_idx
  on public.engagement_messages (engagement_id, created_at);

create index if not exists engagements_client_idx
  on public.engagements (client_id);

-- Dosya paylaşımı için özel (public olmayan) bucket; erişim engagement sahibiyle sınırlı.
insert into storage.buckets (id, name, public, file_size_limit)
values ('engagement-files', 'engagement-files', false, 26214400)
on conflict (id) do nothing;

create policy engagement_files_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'engagement-files'
    and exists (
      select 1 from public.engagements e
      where e.id::text = (storage.foldername(name))[1]
      and e.client_id = auth.uid()
    )
  );

create policy engagement_files_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'engagement-files'
    and exists (
      select 1 from public.engagements e
      where e.id::text = (storage.foldername(name))[1]
      and e.client_id = auth.uid()
    )
  );
