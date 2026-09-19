-- Yerel commit senkronizasyonu (tools/cf-sync) için altyapı.
-- recent_updates: yalnızca show_commit_detail=true projelerde, filtrelenmiş
-- kısa geliştirme notları [{at, text}]. Ham commit mesajı ya da SHA tutulmaz.
alter table public.projects add column if not exists recent_updates jsonb not null default '[]'::jsonb;

-- Senkronizasyon token'larının yalnızca SHA-256 özeti tutulur; token'ın kendisi
-- sadece kurucunun Mac'inde (~/.config/cizgifikrim/sync.env) durur.
create table if not exists public.sync_tokens (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  token_sha256 text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.sync_tokens enable row level security;
revoke all on table public.sync_tokens from anon, authenticated;
