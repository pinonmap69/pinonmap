import { supabase } from './supabase';

export interface PlacePhoto {
  url: string;
}

export interface Place {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  cover_url: string | null;
  created_at: string;
  place_photos?: PlacePhoto[];
}

export interface CreatePlaceInput {
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  cover_url?: string;
  photoUrls?: string[];
}

export async function listPlaces(opts: {
  userId?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Place[]> {
  const { userId, limit = 50, offset = 0 } = opts;
  let query = supabase
    .from('places')
    .select('*, place_photos(url)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Place[];
}

export async function getPlace(id: string): Promise<Place | null> {
  const { data, error } = await supabase
    .from('places')
    .select('*, place_photos(url)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Place | null;
}

export async function createPlace(input: CreatePlaceInput): Promise<Place> {
  const { photoUrls = [], ...placeFields } = input;
  const cover_url = placeFields.cover_url ?? photoUrls[0] ?? null;
  const { data, error } = await supabase
    .from('places')
    .insert({ ...placeFields, cover_url })
    .select('*')
    .single();
  if (error) throw error;
  const place = data as Place;

  if (photoUrls.length > 0) {
    const rows = photoUrls.map((url) => ({
      place_id: place.id,
      user_id: input.user_id,
      url,
    }));
    const { error: photoError } = await supabase.from('place_photos').insert(rows);
    if (photoError) throw photoError;
  }
  return place;
}

export async function deletePlace(id: string): Promise<void> {
  const { error } = await supabase.from('places').delete().eq('id', id);
  if (error) throw error;
}
