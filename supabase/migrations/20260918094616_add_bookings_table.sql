-- Cal.com'dan webhook ile gelen gerçek randevu kayıtları.
-- Tamamen içe dönük: anon/authenticated hiçbir yetkiye sahip değil,
-- sadece cal-webhook Edge Function'ı (service-role ile) yazar.
create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  cal_booking_uid text not null unique,
  event_type text,
  attendee_name text,
  attendee_email text,
  start_time timestamptz,
  end_time timestamptz,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'rescheduled')),
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
-- Kasıtlı olarak hiç policy yok: RLS açık + policy yok = anon/authenticated
-- için tamamen erişilemez, sadece service-role (Edge Function) yazıp okuyabilir.

create index if not exists bookings_start_time_idx on public.bookings (start_time desc);
