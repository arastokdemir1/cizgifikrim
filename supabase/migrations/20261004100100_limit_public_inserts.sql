-- Herkese açık (anon anahtarla) yazılan tablolar için sınırlı INSERT.
-- contact_messages, site_visits, site_clicks: mevcut uzunluk kontrolleri korunur,
-- üstüne (a) genel oran sınırı (kısa pencerede en çok N satır) ve (b) iletişimde
-- aynı e-postadan tekrar sınırı eklenir. Ayrıca site_visits süre güncellemesi için
-- dar bir RPC (set_visit_duration) ve saklama temizliği (purge_old_analytics).
--
-- Not ve sınırlar:
--  * Oran sınırı GLOBALDİR (IP bilinmez); amaç veritabanını doldurmayı ve gelen
--    kutusunu boğmayı yavaşlatmaktır. Saldırgan sınırı doldurarak meşru kullanıcıyı
--    geçici engelleyebilir. Kalıcı çözüm: formun submit-lead edge function'ına
--    taşınması (IP-hash sınırı + Turnstile), bkz. 20261004100200_add_leads.sql.
--  * contact_messages'ta created_at yoksa eklenir (varsa dokunulmaz) [Varsayım:
--    tablo canlıda migration dışı oluşturulmuş; sütun listesi doğrulanmadı].
-- Veri değişmez.
--
-- GERİ ALMA:
--   -- Önceki politikalar için 20260918200153_allow_authenticated_public_reads.sql
--   -- (contact_public_insert) ve 20260923120000_add_site_analytics.sql
--   -- (site_*_public_insert) dosyalarındaki create policy bloklarını yeniden uygula, sonra:
--   drop function if exists public.contact_insert_allowed(text);
--   drop function if exists public.analytics_insert_allowed(text);
--   drop function if exists public.set_visit_duration(uuid, integer);
--   drop function if exists public.purge_old_analytics(integer);
--   drop index if exists contact_messages_created_at_idx;
--   drop index if exists contact_messages_email_idx;

alter table public.contact_messages add column if not exists created_at timestamptz not null default now();
create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_email_idx on public.contact_messages (lower(email), created_at desc);

-- İletişim: 10 dakikada en çok 20 genel kayıt, aynı e-postadan en çok 3.
-- security definer: anon'un tabloyu SELECT etmesine gerek kalmaz.
create or replace function public.contact_insert_allowed(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.contact_messages where created_at > now() - interval '10 minutes') < 20
    and (select count(*) from public.contact_messages
         where lower(email) = lower(p_email) and created_at > now() - interval '10 minutes') < 3;
$$;

-- Analitik: p_table 'visits' | 'clicks'; dakikada en çok 300 ziyaret / 600 tıklama.
create or replace function public.analytics_insert_allowed(p_table text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_table = 'visits' then
    return (select count(*) from public.site_visits where created_at > now() - interval '1 minute') < 300;
  elsif p_table = 'clicks' then
    return (select count(*) from public.site_clicks where created_at > now() - interval '1 minute') < 600;
  end if;
  return false;
end;
$$;

revoke execute on function public.contact_insert_allowed(text) from public;
revoke execute on function public.analytics_insert_allowed(text) from public;
grant execute on function public.contact_insert_allowed(text) to anon, authenticated;
grant execute on function public.analytics_insert_allowed(text) to anon, authenticated;

-- contact_messages
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
  and public.contact_insert_allowed(email)
);

-- site_visits / site_clicks: mevcut check constraint'ler (kimlik deseni, uzunluk) aynen kalır.
drop policy if exists site_visits_public_insert on public.site_visits;
create policy site_visits_public_insert on public.site_visits
  for insert to anon, authenticated
  with check (public.analytics_insert_allowed('visits'));

drop policy if exists site_clicks_public_insert on public.site_clicks;
create policy site_clicks_public_insert on public.site_clicks
  for insert to anon, authenticated
  with check (public.analytics_insert_allowed('clicks'));

-- Süre güncellemesi: tablo UPDATE/SELECT(id) açmak yerine dar RPC.
-- Yalnız son 4 saatte oluşmuş ve süresi henüz boş satır, bir kez güncellenir;
-- id sayılıp başka satırlar ezilemez. İstemci (analytics.js) bunu çağırır; eski
-- PATCH yolunu kapatan migration (…100300) istemci yayına alındıktan SONRA uygulanır.
create or replace function public.set_visit_duration(p_visit_id uuid, p_seconds integer)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.site_visits
     set duration_seconds = least(greatest(p_seconds, 0), 14400)
   where id = p_visit_id
     and duration_seconds is null
     and created_at > now() - interval '4 hours';
$$;

revoke execute on function public.set_visit_duration(uuid, integer) from public;
grant execute on function public.set_visit_duration(uuid, integer) to anon, authenticated;

-- Saklama: yalnız service-role/cron çağırır (örn. pg_cron günlük:
-- select public.purge_old_analytics(180);). Zamanlama BURADA KURULMAZ.
create or replace function public.purge_old_analytics(p_days integer default 180)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.site_clicks where created_at < now() - make_interval(days => p_days);
  delete from public.site_visits where created_at < now() - make_interval(days => p_days);
$$;
revoke execute on function public.purge_old_analytics(integer) from public, anon, authenticated;
