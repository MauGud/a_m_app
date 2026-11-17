-- ============================================
-- CORRER ESTO ANTES DEL PUSH A GITHUB
-- SQL Editor → Run. Debe decir Success.
-- ============================================

-- 1) No guardar un número de tarjeta como processor_ref
UPDATE payment_methods
SET processor_ref = 'cleared'
WHERE processor_ref ~ '^[0-9]{13,19}$';
ALTER TABLE payment_methods DROP CONSTRAINT IF EXISTS payment_methods_no_pan;
ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_no_pan CHECK (
  char_length(processor_ref) < 128
  AND processor_ref !~ '^[0-9]{13,19}$'
);

-- 2) Cuándo entraron con el código (avisos de caducidad con la app cerrada)
ALTER TABLE member_presence ADD COLUMN IF NOT EXISTS last_secret_at TIMESTAMPTZ;
ALTER TABLE member_presence ADD COLUMN IF NOT EXISTS expiry_nudged_at TIMESTAMPTZ;
ALTER TABLE member_presence ADD COLUMN IF NOT EXISTS silence_nudged_at TIMESTAMPTZ;

-- 3) Suscripciones Web Push (iPhone instalado como app + Android + desktop)
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
DROP POLICY IF EXISTS "Users can read push" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can write push" ON push_subscriptions;
CREATE POLICY "Users can read push" ON push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Users can write push" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
