-- ============================================
-- ESPACIO DE PAREJA - MIGRATION
-- Run this in Supabase SQL Editor on the existing project
-- ============================================

DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS idx_instances_secret_hash ON instances(secret_hash);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- New activity categories + Google-style recurrence
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_category_check;
ALTER TABLE activities ADD CONSTRAINT activities_category_check
  CHECK (category IN ('pago', 'recoger', 'pendiente', 'casa', 'compras', 'date', 'meta', 'cumple'));

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_recurring_check;
ALTER TABLE activities ADD CONSTRAINT activities_recurring_check
  CHECK (recurring IN ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'custom'));

ALTER TABLE activities ADD COLUMN IF NOT EXISTS recurring_interval INTEGER NOT NULL DEFAULT 1;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS recurring_unit TEXT NOT NULL DEFAULT 'day';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS recurring_anchor_day INTEGER;

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_recurring_unit_check;
ALTER TABLE activities ADD CONSTRAINT activities_recurring_unit_check
  CHECK (recurring_unit IN ('day', 'week', 'month', 'year'));

-- Allow the couple's anon key to sync in realtime.
-- Queries in the app still filter by instance_id.
DROP POLICY IF EXISTS "Users can read own instance" ON instances;
DROP POLICY IF EXISTS "Users can insert instance" ON instances;
DROP POLICY IF EXISTS "Users can update instance" ON instances;
CREATE POLICY "Users can read own instance" ON instances FOR SELECT USING (true);
CREATE POLICY "Users can insert instance" ON instances FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update instance" ON instances FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can read own plans" ON plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON plans;
DROP POLICY IF EXISTS "Users can update own plans" ON plans;
DROP POLICY IF EXISTS "Users can delete own plans" ON plans;
CREATE POLICY "Users can read own plans" ON plans FOR SELECT USING (true);
CREATE POLICY "Users can insert own plans" ON plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own plans" ON plans FOR UPDATE USING (true);
CREATE POLICY "Users can delete own plans" ON plans FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can read own moods" ON moods;
DROP POLICY IF EXISTS "Users can insert own moods" ON moods;
DROP POLICY IF EXISTS "Users can update own moods" ON moods;
DROP POLICY IF EXISTS "Users can delete own moods" ON moods;
CREATE POLICY "Users can read own moods" ON moods FOR SELECT USING (true);
CREATE POLICY "Users can insert own moods" ON moods FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own moods" ON moods FOR UPDATE USING (true);
CREATE POLICY "Users can delete own moods" ON moods FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can read own memories" ON memories;
DROP POLICY IF EXISTS "Users can insert own memories" ON memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON memories;
CREATE POLICY "Users can read own memories" ON memories FOR SELECT USING (true);
CREATE POLICY "Users can insert own memories" ON memories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own memories" ON memories FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can read own sparks" ON sparks;
DROP POLICY IF EXISTS "Users can insert own sparks" ON sparks;
DROP POLICY IF EXISTS "Users can update own sparks" ON sparks;
CREATE POLICY "Users can read own sparks" ON sparks FOR SELECT USING (true);
CREATE POLICY "Users can insert own sparks" ON sparks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own sparks" ON sparks FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can read own spark submissions" ON spark_submissions;
DROP POLICY IF EXISTS "Users can insert own spark submissions" ON spark_submissions;
DROP POLICY IF EXISTS "Users can update own spark submissions" ON spark_submissions;
CREATE POLICY "Users can read own spark submissions" ON spark_submissions FOR SELECT USING (true);
CREATE POLICY "Users can insert own spark submissions" ON spark_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own spark submissions" ON spark_submissions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can read own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;
DROP POLICY IF EXISTS "Users can update own activities" ON activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON activities;
CREATE POLICY "Users can read own activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own activities" ON activities FOR UPDATE USING (true);
CREATE POLICY "Users can delete own activities" ON activities FOR DELETE USING (true);

-- Realtime (safe to re-run; ignore errors if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE plans;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE moods;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE memories;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sparks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE spark_submissions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE activities;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Storage buckets for Recuerdos and Spark photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('sparks', 'sparks', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Anyone can upload to memories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read memories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to sparks" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read sparks" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update memories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update sparks" ON storage.objects;

CREATE POLICY "Anyone can upload to memories" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'memories');
CREATE POLICY "Anyone can read memories" ON storage.objects FOR SELECT USING (bucket_id = 'memories');
CREATE POLICY "Anyone can update memories" ON storage.objects FOR UPDATE USING (bucket_id = 'memories');
CREATE POLICY "Anyone can upload to sparks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sparks');
CREATE POLICY "Anyone can read sparks" ON storage.objects FOR SELECT USING (bucket_id = 'sparks');
CREATE POLICY "Anyone can update sparks" ON storage.objects FOR UPDATE USING (bucket_id = 'sparks');
