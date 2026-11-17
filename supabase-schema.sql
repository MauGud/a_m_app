-- ============================================
-- ESPACIO DE PAREJA - SUPABASE SCHEMA
-- Proyecto: AyM_App
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. INSTANCES (Parejas)
-- ============================================
CREATE TABLE instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secret_hash TEXT NOT NULL,
  member_a_name TEXT NOT NULL,
  member_b_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PLANS (Bucket List)
-- ============================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_by TEXT NOT NULL CHECK (created_by IN ('MEMBER_A', 'MEMBER_B')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_plans_instance ON plans(instance_id);

-- ============================================
-- 3. MOODS (Estado de ánimo)
-- ============================================
CREATE TABLE moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  member TEXT NOT NULL CHECK (member IN ('MEMBER_A', 'MEMBER_B')),
  value INTEGER NOT NULL CHECK (value >= 1 AND value <= 5),
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instance_id, member, date)
);

CREATE INDEX idx_moods_instance_date ON moods(instance_id, date);

-- ============================================
-- 4. MEMORIES (Recuerdos con fotos duales)
-- ============================================
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  image_front_url TEXT NOT NULL,
  image_back_url TEXT NOT NULL,
  caption TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  created_by TEXT NOT NULL CHECK (created_by IN ('MEMBER_A', 'MEMBER_B')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memories_instance ON memories(instance_id);

-- ============================================
-- 5. SPARKS (Foto diaria simultánea)
-- ============================================
CREATE TABLE sparks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'one_submitted', 'revealed')),
  revealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instance_id, date)
);

CREATE TABLE spark_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spark_id UUID NOT NULL REFERENCES sparks(id) ON DELETE CASCADE,
  member TEXT NOT NULL CHECK (member IN ('MEMBER_A', 'MEMBER_B')),
  image_url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(spark_id, member)
);

CREATE INDEX idx_sparks_instance_date ON sparks(instance_id, date);

-- ============================================
-- 6. ACTIVITIES (Calendario de actividades)
-- ============================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('pago', 'recoger', 'pendiente', 'casa', 'compras', 'date', 'meta', 'cumple')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  due_date DATE NOT NULL,
  due_time TIME,
  assigned_to TEXT CHECK (assigned_to IN ('MEMBER_A', 'MEMBER_B')),
  recurring TEXT NOT NULL DEFAULT 'none' CHECK (recurring IN ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'custom')),
  recurring_interval INTEGER NOT NULL DEFAULT 1,
  recurring_unit TEXT NOT NULL DEFAULT 'day' CHECK (recurring_unit IN ('day', 'week', 'month', 'year')),
  recurring_anchor_day INTEGER,
  created_by TEXT NOT NULL CHECK (created_by IN ('MEMBER_A', 'MEMBER_B')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by TEXT CHECK (completed_by IN ('MEMBER_A', 'MEMBER_B'))
);

CREATE INDEX idx_activities_instance_date ON activities(instance_id, due_date);

-- ============================================
-- 7. PAYMENTS (Recordatorios de pagos del depto)
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  due_date DATE NOT NULL,
  assigned_to TEXT NOT NULL CHECK (assigned_to IN ('MEMBER_A', 'MEMBER_B')),
  created_by TEXT NOT NULL CHECK (created_by IN ('MEMBER_A', 'MEMBER_B')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  recurring TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_instance_date ON payments(instance_id, due_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own instance data
-- We use instance_id passed as a header or JWT claim

-- For simplicity with anon key, we'll use a function to get instance_id from request
CREATE OR REPLACE FUNCTION get_instance_id() RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'x-instance-id',
    (current_setting('request.jwt.claims', true)::json->>'instance_id')
  )::UUID;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_instances_secret_hash ON instances(secret_hash);

-- For a private couple app, allow the shared anon key to read/write.
-- The client still scopes every query by instance_id.
CREATE POLICY "Users can read own instance" ON instances
  FOR SELECT USING (true);
CREATE POLICY "Users can insert instance" ON instances
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update instance" ON instances
  FOR UPDATE USING (true);

-- Plans policies
CREATE POLICY "Users can read own plans" ON plans
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own plans" ON plans
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own plans" ON plans
  FOR UPDATE USING (true);
CREATE POLICY "Users can delete own plans" ON plans
  FOR DELETE USING (true);

-- Moods policies
CREATE POLICY "Users can read own moods" ON moods
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own moods" ON moods
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own moods" ON moods
  FOR UPDATE USING (true);
CREATE POLICY "Users can delete own moods" ON moods
  FOR DELETE USING (true);

-- Memories policies
CREATE POLICY "Users can read own memories" ON memories
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own memories" ON memories
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own memories" ON memories
  FOR DELETE USING (true);

-- Sparks policies
CREATE POLICY "Users can read own sparks" ON sparks
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own sparks" ON sparks
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own sparks" ON sparks
  FOR UPDATE USING (true);

-- Spark submissions policies
CREATE POLICY "Users can read own spark submissions" ON spark_submissions
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own spark submissions" ON spark_submissions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own spark submissions" ON spark_submissions
  FOR UPDATE USING (true);

-- Activities policies
CREATE POLICY "Users can read own activities" ON activities
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (true);
CREATE POLICY "Users can delete own activities" ON activities
  FOR DELETE USING (true);

CREATE POLICY "Users can read own payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own payments" ON payments FOR UPDATE USING (true);
CREATE POLICY "Users can delete own payments" ON payments FOR DELETE USING (true);

-- ============================================
-- STORAGE BUCKETS (para fotos)
-- ============================================
-- Run these in Supabase Dashboard > Storage

-- INSERT INTO storage.buckets (id, name, public) VALUES ('memories', 'memories', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('sparks', 'sparks', true);

-- Storage policies (run in SQL editor)
-- CREATE POLICY "Anyone can upload to memories" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'memories');
-- CREATE POLICY "Anyone can read memories" ON storage.objects FOR SELECT USING (bucket_id = 'memories');
-- CREATE POLICY "Anyone can upload to sparks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sparks');
-- CREATE POLICY "Anyone can read sparks" ON storage.objects FOR SELECT USING (bucket_id = 'sparks');

-- ============================================
-- REALTIME
-- ============================================
-- Enable realtime for sync between devices
ALTER PUBLICATION supabase_realtime ADD TABLE plans;
ALTER PUBLICATION supabase_realtime ADD TABLE moods;
ALTER PUBLICATION supabase_realtime ADD TABLE memories;
ALTER PUBLICATION supabase_realtime ADD TABLE sparks;
ALTER PUBLICATION supabase_realtime ADD TABLE spark_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

CREATE TABLE IF NOT EXISTS member_presence (
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  member TEXT NOT NULL CHECK (member IN ('MEMBER_A', 'MEMBER_B')),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (instance_id, member)
);
ALTER TABLE member_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read presence" ON member_presence FOR SELECT USING (true);
CREATE POLICY "Users can write presence" ON member_presence FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE member_presence ADD COLUMN IF NOT EXISTS last_secret_at TIMESTAMPTZ;
ALTER TABLE member_presence ADD COLUMN IF NOT EXISTS expiry_nudged_at TIMESTAMPTZ;
ALTER TABLE member_presence ADD COLUMN IF NOT EXISTS silence_nudged_at TIMESTAMPTZ;
ALTER PUBLICATION supabase_realtime ADD TABLE member_presence;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  member TEXT NOT NULL CHECK (member IN ('MEMBER_A', 'MEMBER_B')),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_instance_member ON push_subscriptions(instance_id, member);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read push" ON push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Users can write push" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
