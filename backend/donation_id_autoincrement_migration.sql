-- Make donations.donation_id auto-increment and backfill sequence value.
-- Safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND c.relname = 'donations_donation_id_seq'
      AND n.nspname = 'public'
  ) THEN
    CREATE SEQUENCE public.donations_donation_id_seq;
  END IF;
END $$;

ALTER TABLE public.donations
  ALTER COLUMN donation_id SET DEFAULT nextval('public.donations_donation_id_seq');

SELECT setval(
  'public.donations_donation_id_seq',
  COALESCE((SELECT MAX(donation_id) FROM public.donations), 0)
);

ALTER SEQUENCE public.donations_donation_id_seq
  OWNED BY public.donations.donation_id;
