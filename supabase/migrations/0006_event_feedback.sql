-- TSNS — etkinlik geri bildirimleri (anonim anket).
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> bu dosyanin tamami -> Run.
--   Idempotent: tekrar calistirmak zararsiz.
--
-- NEDEN
--   /geri-bildirim/<etkinlik> formu (functions/api/feedback.js). Anket ANONIM:
--   contacts tablosuna baglanmaz; ad, e-posta, IP saklanmaz. Her satir bir
--   gonderim. Puanlar 1-5, cevaplanmayan kategori null.
--
-- GUVENLIK
--   Diger tablolar gibi: RLS acik, policy yok, yalnizca service_role (Worker).

create table if not exists public.event_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_slug text not null,
  yemek        smallint check (yemek        between 1 and 5),
  organizasyon smallint check (organizasyon between 1 and 5),
  muzik        smallint check (muzik        between 1 and 5),
  konum        smallint check (konum        between 1 and 5),
  ilgi         smallint check (ilgi         between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  lang text not null default 'tr' check (lang in ('tr', 'en'))
);

create index if not exists event_feedback_event_idx on public.event_feedback (event_slug, created_at desc);

alter table public.event_feedback enable row level security;

grant all privileges on public.event_feedback to service_role;
revoke all on public.event_feedback from anon, authenticated;

-- Etkinlik basina ozet: kac kisi cevapladi, kategori ortalamalari.
--   select * from event_feedback_summary where event_slug = 'cumhuriyet-bayrami-2026';
create or replace view public.event_feedback_summary with (security_invoker = true) as
select
  event_slug,
  count(*)                                   as responses,
  round(avg(yemek), 2)                       as yemek_avg,
  round(avg(organizasyon), 2)                as organizasyon_avg,
  round(avg(muzik), 2)                       as muzik_avg,
  round(avg(konum), 2)                       as konum_avg,
  round(avg(ilgi), 2)                        as ilgi_avg,
  count(comment) filter (where comment <> '') as comments,
  min(created_at)                            as first_response_at,
  max(created_at)                            as last_response_at
from public.event_feedback
group by event_slug;

grant select on public.event_feedback_summary to service_role;
revoke all on public.event_feedback_summary from anon, authenticated;
