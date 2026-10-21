-- ComplyEC — identité des documents générés (21 octobre 2026)
-- Couleurs, police et logo JPEG portés par tous les documents du cabinet.
alter table public.cabinets add column if not exists identite_documents jsonb not null default '{}'::jsonb;
