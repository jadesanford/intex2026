-- Make supporters.supporter_id auto-increment and backfill sequence value.
-- Safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND c.relname = 'supporters_supporter_id_seq'
      AND n.nspname = 'public'
  ) THEN
    CREATE SEQUENCE public.supporters_supporter_id_seq;
  END IF;
END $$;

ALTER TABLE public.supporters
  ALTER COLUMN supporter_id SET DEFAULT nextval('public.supporters_supporter_id_seq');

SELECT setval(
  'public.supporters_supporter_id_seq',
  COALESCE((SELECT MAX(supporter_id) FROM public.supporters), 0)
);

ALTER SEQUENCE public.supporters_supporter_id_seq
  OWNED BY public.supporters.supporter_id;
