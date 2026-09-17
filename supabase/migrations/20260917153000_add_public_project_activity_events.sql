-- CizgiFikrim çalışma alanı için yayınlanabilir, arındırılmış olay akışı.
--
-- İleri adım: yalnızca append-only olay tablosu, okuma politikası ve indeks ekler.
-- Veri kaybı riski: yok. Mevcut tablo ve satırlar değiştirilmez.
-- Geri alma (gerektiğinde, ayrıca uygulanır):
--   alter publication supabase_realtime drop table public.project_activity_events;
--   drop table public.project_activity_events;
--
-- Önemli: Bu tabloya browser/anon yazamaz. Gerçek ajan çalıştırıcısı,
-- service-role kullanan güvenilir bir sunucu/worker üzerinden sadece
-- yayınlanması güvenli olan kısa özetleri eklemelidir. Kod, secret,
-- kullanıcı verisi veya ayrıntılı terminal çıktısı yazılmamalıdır.

create table if not exists public.project_activity_events (
  id bigint generated always as identity primary key,
  project_slug text not null check (char_length(project_slug) between 1 and 120),
  event_type text not null check (event_type in ('status', 'message', 'movement', 'task')),
  agent_key text not null check (char_length(agent_key) between 1 and 80),
  target_agent_key text check (target_agent_key is null or char_length(target_agent_key) between 1 and 80),
  summary text not null check (char_length(btrim(summary)) between 1 and 280),
  status text not null default 'working' check (status in ('working', 'reviewing', 'waiting', 'done')),
  occurred_at timestamptz not null default now(),
  is_public boolean not null default true,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

create index if not exists project_activity_events_public_feed_idx
  on public.project_activity_events (project_slug, occurred_at desc)
  where is_public = true;

alter table public.project_activity_events enable row level security;

revoke all privileges on table public.project_activity_events from anon, authenticated;
grant select on table public.project_activity_events to anon, authenticated;

drop policy if exists project_activity_events_public_read on public.project_activity_events;
create policy project_activity_events_public_read
on public.project_activity_events
for select
to anon, authenticated
using (is_public = true);

-- Supabase Realtime yayını: var olan publication'a yalnız bir kez ekler.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_rel pr
       join pg_publication p on p.oid = pr.prpubid
       join pg_class c on c.oid = pr.prrelid
       join pg_namespace n on n.oid = c.relnamespace
       where p.pubname = 'supabase_realtime'
         and n.nspname = 'public'
         and c.relname = 'project_activity_events'
     ) then
    execute 'alter publication supabase_realtime add table public.project_activity_events';
  end if;
end $$;
