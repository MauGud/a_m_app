import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isModernKey = supabaseAnonKey.startsWith('sb_');

function createCoupleClient(extraHeaders?: Record<string, string>): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: extraHeaders,
      fetch: async (input, init = {}) => {
        const headers = new Headers(init.headers);
        headers.set('apikey', supabaseAnonKey);
        if (isModernKey) {
          const auth = headers.get('Authorization');
          if (auth?.startsWith(`Bearer ${supabaseAnonKey}`) || auth?.startsWith('Bearer sb_')) {
            headers.delete('Authorization');
          }
        }
        if (extraHeaders) {
          Object.entries(extraHeaders).forEach(([key, value]) => headers.set(key, value));
        }
        return fetch(input, { ...init, headers });
      },
    },
  });
}

let _supabase: SupabaseClient | null = null;

export const supabase = (() => {
  if (!_supabase) {
    _supabase = createCoupleClient();
  }
  return _supabase as SupabaseClient;
})();

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseWithInstance(instanceId: string): SupabaseClient | null {
  return createCoupleClient({ 'x-instance-id': instanceId });
}

export function logSupabaseError(context: string, error: { message?: string } | null | undefined) {
  if (!error) return;
  console.warn(`[supabase] ${context}:`, error.message || error);
}

export async function uploadImage(
  bucket: 'memories' | 'sparks',
  base64Data: string,
  fileName: string
): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();

    const upload = supabase.storage.from(bucket).upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
    const raced = await Promise.race([upload, timeout]);
    if (!raced) {
      console.error('Upload timed out:', fileName);
      return null;
    }
    const { data, error } = raced;

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (err) {
    console.error('Upload error:', err);
    return null;
  }
}

export interface DbInstance {
  id: string;
  secret_hash: string;
  member_a_name: string;
  member_b_name: string;
  created_at: string;
}

export interface DbMood {
  id: string;
  instance_id: string;
  member: 'MEMBER_A' | 'MEMBER_B';
  value: number;
  note: string | null;
  date: string;
  created_at: string;
}

export interface DbMemory {
  id: string;
  instance_id: string;
  image_front_url: string;
  image_back_url: string;
  caption: string | null;
  date_id?: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  created_by: 'MEMBER_A' | 'MEMBER_B';
  created_at: string;
}

export interface DbSpark {
  id: string;
  instance_id: string;
  date: string;
  status: 'waiting' | 'one_submitted' | 'revealed';
  revealed_at: string | null;
  created_at: string;
}

export interface DbSparkSubmission {
  id: string;
  spark_id: string;
  member: 'MEMBER_A' | 'MEMBER_B';
  image_url: string;
  submitted_at: string;
}

export interface DbActivity {
  id: string;
  instance_id: string;
  title: string;
  description: string | null;
  category: 'pago' | 'recoger' | 'pendiente' | 'casa' | 'compras' | 'date' | 'meta' | 'cumple';
  status: 'pending' | 'completed';
  due_date: string;
  due_time: string | null;
  assigned_to: 'MEMBER_A' | 'MEMBER_B' | null;
  recurring: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';
  recurring_interval?: number | null;
  recurring_unit?: 'day' | 'week' | 'month' | 'year' | null;
  recurring_anchor_day?: number | null;
  updated_at?: string | null;
  created_by: 'MEMBER_A' | 'MEMBER_B';
  created_at: string;
  completed_at: string | null;
  completed_by: 'MEMBER_A' | 'MEMBER_B' | null;
  extra?: Record<string, unknown> | null;
}

export interface DbPayment {
  id: string;
  instance_id: string;
  title: string;
  amount: number;
  notes: string | null;
  due_date: string;
  assigned_to: 'MEMBER_A' | 'MEMBER_B';
  created_by: 'MEMBER_A' | 'MEMBER_B';
  status: 'pending' | 'completed';
  recurring: string;
  created_at: string;
  completed_at: string | null;
  notified_at: string | null;
  updated_at?: string | null;
}
