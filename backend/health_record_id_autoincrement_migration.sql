-- Make health_wellbeing_records.health_record_id auto-increment and backfill sequence value.
-- Safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND c.relname = 'health_wellbeing_records_health_record_id_seq'
      AND n.nspname = 'public'
  ) THEN
    CREATE SEQUENCE public.health_wellbeing_records_health_record_id_seq;
  END IF;
END $$;

ALTER TABLE public.health_wellbeing_records
  ALTER COLUMN health_record_id SET DEFAULT nextval('public.health_wellbeing_records_health_record_id_seq');

SELECT setval(
  'public.health_wellbeing_records_health_record_id_seq',
  COALESCE((SELECT MAX(health_record_id) FROM public.health_wellbeing_records), 0)
);

ALTER SEQUENCE public.health_wellbeing_records_health_record_id_seq
  OWNED BY public.health_wellbeing_records.health_record_id;
