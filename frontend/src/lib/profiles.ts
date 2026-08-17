import { supabase } from './supabase';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ProfileStats {
  pins: number;
  cities: number;
  countries: number;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function ensureProfile(userId: string, fallbackName?: string): Promise<Profile | null> {
  const existing = await getProfile(userId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, display_name: fallbackName ?? 'Traveler' }, { onConflict: 'id' })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  fields: Partial<Pick<Profile, 'display_name' | 'bio' | 'avatar_url' | 'username'>>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const { data, error } = await supabase
    .from('places')
    .select('city, country')
    .eq('user_id', userId);
  if (error) throw error;
  const rows = data ?? [];
  const cities = new Set(rows.map((r: any) => (r.city || '').trim().toLowerCase()).filter(Boolean));
  const countries = new Set(rows.map((r: any) => (r.country || '').trim().toLowerCase()).filter(Boolean));
  return { pins: rows.length, cities: cities.size, countries: countries.size };
}
