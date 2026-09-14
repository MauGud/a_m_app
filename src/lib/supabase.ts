import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if we have credentials
let _supabase: SupabaseClient | null = null;

export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for build time
    return null as unknown as SupabaseClient;
  }
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
})();

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// Helper to set instance ID for RLS
export function getSupabaseWithInstance(instanceId: string): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-instance-id': instanceId,
      },
    },
  });
}

// Upload image to storage
export async function uploadImage(
  bucket: 'memories' | 'sparks',
  base64Data: string,
  fileName: string
): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured()) return null;
  
  try {
    // Convert base64 to blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Upload error:', err);
    return null;
  }
}

// Database types
export interface DbInstance {
  id: string;
  secret_hash: string;
  member_a_name: string;
  member_b_name: string;
  created_at: string;
}

export interface DbPlan {
  id: string;
  instance_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'completed';
  created_by: 'MEMBER_A' | 'MEMBER_B';
  created_at: string;
  completed_at: string | null;
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
  category: 'pago' | 'recoger' | 'pendiente' | 'casa' | 'compras';
  status: 'pending' | 'completed';
  due_date: string;
  due_time: string | null;
  assigned_to: 'MEMBER_A' | 'MEMBER_B' | null;
  recurring: 'none' | 'weekly' | 'monthly';
  created_by: 'MEMBER_A' | 'MEMBER_B';
  created_at: string;
  completed_at: string | null;
  completed_by: 'MEMBER_A' | 'MEMBER_B' | null;
}
