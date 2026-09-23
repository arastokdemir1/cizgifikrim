-- Postgres, "UPDATE ... WHERE id = ..." calistirmak icin SET edilen sutuna
-- UPDATE izninin yaninda WHERE'de gecen sutuna (id) da SELECT izni istiyor.
-- Sadece id sutununu aciyoruz -- page/duration/visitor_id/referrer gibi
-- gercek analitik veriler bu izinle GORULEMEZ, hala yalnizca is_admin=true
-- olan hesap (site_visits_admin_select politikasi) tum satiri okuyabilir.

grant select (id) on public.site_visits to anon, authenticated;

create policy site_visits_public_select_id on public.site_visits
  for select to anon, authenticated using (true);
