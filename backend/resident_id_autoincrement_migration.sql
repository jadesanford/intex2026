-- Make residents.resident_id auto-increment and backfill sequence value.
-- Safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND c.relname = 'residents_resident_id_seq'
      AND n.nspname = 'public'
  ) THEN
    CREATE SEQUENCE public.residents_resident_id_seq;
  END IF;
END $$;

ALTER TABLE public.residents
  ALTER COLUMN resident_id SET DEFAULT nextval('public.residents_resident_id_seq');

SELECT setval(
  'public.residents_resident_id_seq',
  COALESCE((SELECT MAX(resident_id) FROM public.residents), 0)
);

ALTER SEQUENCE public.residents_resident_id_seq
  OWNED BY public.residents.resident_id;
