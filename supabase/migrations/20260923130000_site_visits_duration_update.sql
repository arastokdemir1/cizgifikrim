-- site_visits artik iki adimda yaziliyor: sayfa yuklenince satir hemen
-- eklenir (duration_seconds bos), sayfadan ayrilirken (en iyi caba) yalnizca
-- duration_seconds guncellenir. Bu yuzden dar kapsamli bir UPDATE izni
-- gerekiyor. id rastgele UUID oldugundan tahmin edilemez; en kotu ihtimalle
-- biri bir satirin suresini bozabilir -- hassas veri degil, kabul edilebilir.

grant update (duration_seconds) on public.site_visits to anon, authenticated;

create policy site_visits_public_update_duration on public.site_visits
  for update to anon, authenticated using (true) with check (true);
