-- A & M — realtime para los dos teléfonos
-- Pegar en Supabase → SQL Editor → Run
-- Hace falta REPLICA IDENTITY FULL para que UPDATE/DELETE
-- con filtro instance_id lleguen por websocket.

ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'moods',
    'memories',
    'sparks',
    'spark_submissions',
    'activities',
    'payments',
    'finanzas_snapshots',
    'member_presence',
    'payment_methods'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', t);
    EXCEPTION
      WHEN undefined_table THEN NULL;
    END;
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;
