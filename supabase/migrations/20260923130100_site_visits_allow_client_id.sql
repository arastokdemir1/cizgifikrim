-- Ziyaret satirinin id'sini artik istemci (analytics.js) uretiyor, boylece
-- sonraki sure guncellemesi (PATCH) icin sunucudan geri okumaya
-- (return=representation -> SELECT izni gerektirir) ihtiyac kalmiyor.
-- id sutununu acikca gonderebilmek icin bu sutuna da INSERT izni gerekiyor
-- (sutun bazli izinlerde deger verilen her sutun ayrica yetkilendirilmeli).

grant insert (id) on public.site_visits to anon, authenticated;
