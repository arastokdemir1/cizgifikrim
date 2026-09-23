-- Site içi ziyaretçi analitiği: sayfa görüntüleme + süre + tıklama.
-- Üçüncü taraf analitik/reklam servisi yok; veri yalnızca bu projede kalır,
-- kimseyle paylaşılmaz. Ziyaretçi kimliği rastgele, kimlikle eşleştirilmez.

alter table public.clients add column if not exists is_admin boolean not null default false;

create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text not null,
  page text not null,
  referrer text,
  duration_seconds integer,
  viewport text,
  created_at timestamptz not null default now(),
  constraint site_visits_visitor_id_check check (visitor_id ~ '^[A-Za-z0-9_-]{8,40}$'),
  constraint site_visits_session_id_check check (session_id ~ '^[A-Za-z0-9_-]{8,40}$'),
  constraint site_visits_page_check check (char_length(page) between 1 and 200),
  constraint site_visits_referrer_check check (referrer is null or char_length(referrer) <= 300),
  constraint site_visits_viewport_check check (viewport is null or viewport in ('mobile', 'desktop')),
  constraint site_visits_duration_check check (duration_seconds is null or duration_seconds between 0 and 14400)
);

create table public.site_clicks (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text not null,
  page text not null,
  label text not null,
  created_at timestamptz not null default now(),
  constraint site_clicks_visitor_id_check check (visitor_id ~ '^[A-Za-z0-9_-]{8,40}$'),
  constraint site_clicks_session_id_check check (session_id ~ '^[A-Za-z0-9_-]{8,40}$'),
  constraint site_clicks_page_check check (char_length(page) between 1 and 200),
  constraint site_clicks_label_check check (char_length(label) between 1 and 120)
);

create index site_visits_created_at_idx on public.site_visits (created_at desc);
create index site_visits_page_idx on public.site_visits (page);
create index site_clicks_created_at_idx on public.site_clicks (created_at desc);

alter table public.site_visits enable row level security;
alter table public.site_clicks enable row level security;

revoke all on table public.site_visits from anon, authenticated;
revoke all on table public.site_clicks from anon, authenticated;
grant insert (visitor_id, session_id, page, referrer, duration_seconds, viewport) on public.site_visits to anon, authenticated;
grant insert (visitor_id, session_id, page, label) on public.site_clicks to anon, authenticated;

create policy site_visits_public_insert on public.site_visits
  for insert to anon, authenticated with check (true);
create policy site_clicks_public_insert on public.site_clicks
  for insert to anon, authenticated with check (true);

-- Sadece kurucu (clients.is_admin = true) okuyabilir; başka hiç kimse rakamları göremez.
grant select on public.site_visits to authenticated;
grant select on public.site_clicks to authenticated;
create policy site_visits_admin_select on public.site_visits
  for select to authenticated using (exists (select 1 from public.clients c where c.id = auth.uid() and c.is_admin));
create policy site_clicks_admin_select on public.site_clicks
  for select to authenticated using (exists (select 1 from public.clients c where c.id = auth.uid() and c.is_admin));
