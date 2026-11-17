-- ============================================
-- A & M — RESTO (copy & paste UNA vez)
-- No borra lo que ya creaste. Completa el esquema actual.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Instances: tu SQL solo permite SELECT. La app hace upsert al entrar.
CREATE UNIQUE INDEX IF NOT EXISTS idx_instances_secret_hash ON instances(secret_hash);

DROP POLICY IF EXISTS "read_instance" ON instances;
DROP POLICY IF EXISTS "Users can read own instance" ON instances;
DROP POLICY IF EXISTS "Users can insert instance" ON instances;
DROP POLICY IF EXISTS "Users can update instance" ON instances;
CREATE POLICY "Users can read own instance" ON instances FOR SELECT USING (true);
CREATE POLICY "Users can insert instance" ON instances FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update instance" ON instances FOR UPDATE USING (true);

-- 2) Activities: Date Juntos, Metas, cumpleaños, recurrencia Google-style, extra
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_category_check;
ALTER TABLE activities ADD CONSTRAINT activities_category_check
  CHECK (category IN ('pago', 'recoger', 'pendiente', 'casa', 'compras', 'date', 'meta', 'cumple'));

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_recurring_check;
ALTER TABLE activities ADD CONSTRAINT activities_recurring_check
  CHECK (recurring IN ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'custom'));

ALTER TABLE activities ADD COLUMN IF NOT EXISTS recurring_interval INTEGER NOT NULL DEFAULT 1;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS recurring_unit TEXT NOT NULL DEFAULT 'day';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS recurring_anchor_day INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS extra JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_recurring_unit_check;
ALTER TABLE activities ADD CONSTRAINT activities_recurring_unit_check
  CHECK (recurring_unit IN ('day', 'week', 'month', 'year'));

ALTER TABLE memories ADD COLUMN IF NOT EXISTS date_id UUID;
CREATE INDEX IF NOT EXISTS idx_memories_date_id ON memories(date_id);

-- 3) Políticas abiertas para la anon key (la app igual filtra por instance_id).
--    Tus políticas get_instance_id() dejan fuera al cliente actual.
DROP POLICY IF EXISTS "read_plans" ON plans;
DROP POLICY IF EXISTS "insert_plans" ON plans;
DROP POLICY IF EXISTS "update_plans" ON plans;
DROP POLICY IF EXISTS "delete_plans" ON plans;
DROP POLICY IF EXISTS "Users can read own plans" ON plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON plans;
DROP POLICY IF EXISTS "Users can update own plans" ON plans;
DROP POLICY IF EXISTS "Users can delete own plans" ON plans;
CREATE POLICY "Users can read own plans" ON plans FOR SELECT USING (true);
CREATE POLICY "Users can insert own plans" ON plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own plans" ON plans FOR UPDATE USING (true);
CREATE POLICY "Users can delete own plans" ON plans FOR DELETE USING (true);

DROP POLICY IF EXISTS "read_moods" ON moods;
DROP POLICY IF EXISTS "insert_moods" ON moods;
DROP POLICY IF EXISTS "update_moods" ON moods;
DROP POLICY IF EXISTS "Users can read own moods" ON moods;
DROP POLICY IF EXISTS "Users can insert own moods" ON moods;
DROP POLICY IF EXISTS "Users can update own moods" ON moods;
DROP POLICY IF EXISTS "Users can delete own moods" ON moods;
CREATE POLICY "Users can read own moods" ON moods FOR SELECT USING (true);
CREATE POLICY "Users can insert own moods" ON moods FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own moods" ON moods FOR UPDATE USING (true);
CREATE POLICY "Users can delete own moods" ON moods FOR DELETE USING (true);

DROP POLICY IF EXISTS "read_memories" ON memories;
DROP POLICY IF EXISTS "insert_memories" ON memories;
DROP POLICY IF EXISTS "delete_memories" ON memories;
DROP POLICY IF EXISTS "Users can read own memories" ON memories;
DROP POLICY IF EXISTS "Users can insert own memories" ON memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON memories;
CREATE POLICY "Users can read own memories" ON memories FOR SELECT USING (true);
CREATE POLICY "Users can insert own memories" ON memories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own memories" ON memories FOR DELETE USING (true);

DROP POLICY IF EXISTS "read_sparks" ON sparks;
DROP POLICY IF EXISTS "insert_sparks" ON sparks;
DROP POLICY IF EXISTS "update_sparks" ON sparks;
DROP POLICY IF EXISTS "Users can read own sparks" ON sparks;
DROP POLICY IF EXISTS "Users can insert own sparks" ON sparks;
DROP POLICY IF EXISTS "Users can update own sparks" ON sparks;
CREATE POLICY "Users can read own sparks" ON sparks FOR SELECT USING (true);
CREATE POLICY "Users can insert own sparks" ON sparks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own sparks" ON sparks FOR UPDATE USING (true);

DROP POLICY IF EXISTS "read_spark_subs" ON spark_submissions;
DROP POLICY IF EXISTS "insert_spark_subs" ON spark_submissions;
DROP POLICY IF EXISTS "Users can read own spark submissions" ON spark_submissions;
DROP POLICY IF EXISTS "Users can insert own spark submissions" ON spark_submissions;
DROP POLICY IF EXISTS "Users can update own spark submissions" ON spark_submissions;
CREATE POLICY "Users can read own spark submissions" ON spark_submissions FOR SELECT USING (true);
CREATE POLICY "Users can insert own spark submissions" ON spark_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own spark submissions" ON spark_submissions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "read_activities" ON activities;
DROP POLICY IF EXISTS "insert_activities" ON activities;
DROP POLICY IF EXISTS "update_activities" ON activities;
DROP POLICY IF EXISTS "delete_activities" ON activities;
DROP POLICY IF EXISTS "Users can read own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;
DROP POLICY IF EXISTS "Users can update own activities" ON activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON activities;
CREATE POLICY "Users can read own activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own activities" ON activities FOR UPDATE USING (true);
CREATE POLICY "Users can delete own activities" ON activities FOR DELETE USING (true);

-- 4) Pagos del depto
CREATE TABLE IF NOT EXISTS payments (
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
CREATE INDEX IF NOT EXISTS idx_payments_instance_date ON payments(instance_id, due_date);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON payments;
CREATE POLICY "Users can read own payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own payments" ON payments FOR UPDATE USING (true);
CREATE POLICY "Users can delete own payments" ON payments FOR DELETE USING (true);

-- 5) Finanzas Mau (gemelo JSON)
CREATE TABLE IF NOT EXISTS finanzas_snapshots (
  instance_id UUID PRIMARY KEY REFERENCES instances(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'app',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  heartbeat_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE finanzas_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read finanzas" ON finanzas_snapshots;
DROP POLICY IF EXISTS "Users can write finanzas" ON finanzas_snapshots;
CREATE POLICY "Users can read finanzas" ON finanzas_snapshots FOR SELECT USING (true);
CREATE POLICY "Users can write finanzas" ON finanzas_snapshots FOR ALL USING (true) WITH CHECK (true);

-- 6) Vault de tarjetas: alias + last4. Nunca PAN/CVV.
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  brand TEXT NOT NULL,
  last4 TEXT NOT NULL CHECK (last4 ~ '^\d{4}$'),
  exp_month INTEGER NOT NULL CHECK (exp_month BETWEEN 1 AND 12),
  exp_year INTEGER NOT NULL,
  owner TEXT NOT NULL CHECK (owner IN ('MEMBER_A', 'MEMBER_B')),
  processor TEXT NOT NULL DEFAULT 'handoff',
  processor_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT payment_methods_no_pan CHECK (
    char_length(processor_ref) < 128
    AND processor_ref !~ '^[0-9]{13,19}$'
  )
);
CREATE INDEX IF NOT EXISTS idx_payment_methods_instance ON payment_methods(instance_id);
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can write methods" ON payment_methods;
CREATE POLICY "Users can read methods" ON payment_methods FOR SELECT USING (true);
CREATE POLICY "Users can write methods" ON payment_methods FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE payment_methods DROP COLUMN IF EXISTS pan;
ALTER TABLE payment_methods DROP COLUMN IF EXISTS cvv;
ALTER TABLE payment_methods DROP COLUMN IF EXISTS card_number;
ALTER TABLE payment_methods DROP COLUMN IF EXISTS number;

-- 7) Presencia: aviso "Amanda ya no entró"
CREATE TABLE IF NOT EXISTS member_presence (
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  member TEXT NOT NULL CHECK (member IN ('MEMBER_A', 'MEMBER_B')),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (instance_id, member)
);
ALTER TABLE member_presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read presence" ON member_presence;
DROP POLICY IF EXISTS "Users can write presence" ON member_presence;
CREATE POLICY "Users can read presence" ON member_presence FOR SELECT USING (true);
CREATE POLICY "Users can write presence" ON member_presence FOR ALL USING (true) WITH CHECK (true);

-- 8) Huella de uso (Mau) + carrito opcional
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  member TEXT NOT NULL CHECK (member IN ('MEMBER_A', 'MEMBER_B')),
  kind TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usage_instance ON usage_events(instance_id, created_at DESC);
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read usage" ON usage_events;
DROP POLICY IF EXISTS "Users can insert usage" ON usage_events;
CREATE POLICY "Users can read usage" ON usage_events FOR SELECT USING (true);
CREATE POLICY "Users can insert usage" ON usage_events FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  sku_id TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read cart" ON cart_items;
DROP POLICY IF EXISTS "Users can write cart" ON cart_items;
CREATE POLICY "Users can read cart" ON cart_items FOR SELECT USING (true);
CREATE POLICY "Users can write cart" ON cart_items FOR ALL USING (true) WITH CHECK (true);

-- 9) Realtime de lo nuevo (lo viejo ya lo tienes)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE payments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE finanzas_snapshots;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE member_presence;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE payment_methods;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 10) Fotos de Recuerdos y Spark
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('sparks', 'sparks', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Anyone can upload to memories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read memories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update memories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to sparks" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read sparks" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update sparks" ON storage.objects;
CREATE POLICY "Anyone can upload to memories" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'memories');
CREATE POLICY "Anyone can read memories" ON storage.objects FOR SELECT USING (bucket_id = 'memories');
CREATE POLICY "Anyone can update memories" ON storage.objects FOR UPDATE USING (bucket_id = 'memories');
CREATE POLICY "Anyone can upload to sparks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sparks');
CREATE POLICY "Anyone can read sparks" ON storage.objects FOR SELECT USING (bucket_id = 'sparks');
CREATE POLICY "Anyone can update sparks" ON storage.objects FOR UPDATE USING (bucket_id = 'sparks');
