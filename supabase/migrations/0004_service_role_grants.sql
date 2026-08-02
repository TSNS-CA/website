-- TSNS — service_role'e public şemasında yetki ver.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> bu dosyanin tamami -> Run.
--   Idempotent: tekrar calistirmak zararsiz.
--
-- NEDEN
--   Worker, Supabase'e yalnizca service_role anahtariyla baglaniyor. Supabase
--   eskiden public semasindaki her tabloya anon/authenticated/service_role
--   rollerine otomatik yetki veriyordu; Nisan 2026'dan itibaren yeni
--   projelerde bu varsayilan kapali. Tablolar duruyor, RLS'i service_role
--   zaten asiyor, ama tabloya dokunma yetkisi hic verilmedigi icin PostgREST
--   42501 donuyor:
--
--     permission denied for table contacts
--
--   Bunun disa vurumu sinsi: _lib/supabase.js her hatayi yutup null donduyor,
--   yani formlar "ok" diyor ve hicbir sey yazilmiyordu. Sandbox'ta olusan
--   $25'lik uyelik Square'de vardi, burada yoktu.
--
-- NEDEN SADECE service_role
--   anon ve authenticated'a bilerek yetki VERMIYORUZ. Bu tablolara yalnizca
--   sunucu tarafindaki Worker dokunuyor; tarayiciya acilan bir Data API
--   yuzeyi olmasin. 0001-0003'te views uzerinden yapilan revoke'lar da ayni
--   mantiktaydi.

grant usage on schema public to service_role;

-- Mevcut tablolar ve view'lar (people, members, subscribers dahil).
grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- Bundan sonra olusturulacaklar. Bu satirlar olmazsa bir sonraki migration'da
-- eklenen her tablo ayni hatayi bastan verir.
alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;
