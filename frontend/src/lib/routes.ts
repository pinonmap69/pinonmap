import { supabase } from './supabase';
import type { LatLng } from './geo';
import type { TravelMode } from './routing';
import type { BoardVisibility } from './boards';

export interface RouteStop extends LatLng {
  title: string;
  place_id?: string | null;
  cover_url?: string | null;
}

export interface SavedRoute {
  id: string;
  user_id: string;
  name: string;
  start_point: RouteStop;
  end_point: RouteStop;
  stops: RouteStop[];
  geometry: LatLng[] | null;
  distance_m: number | null;
  duration_s: number | null;
  radius_km: number;
  mode: TravelMode;
  visibility: BoardVisibility;
  board_id: string | null;
  created_at: string;
}

export type RouteInput = Omit<SavedRoute, 'id' | 'created_at'>;

export async function listRoutes(userId: string): Promise<SavedRoute[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('id,user_id,name,start_point,end_point,stops,distance_m,duration_s,radius_km,mode,visibility,board_id,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedRoute[];
}

export async function getRoute(id: string): Promise<SavedRoute | null> {
  const { data, error } = await supabase.from('routes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as SavedRoute | null;
}

export async function saveRoute(input: RouteInput, id?: string): Promise<SavedRoute> {
  const q = id
    ? supabase.from('routes').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id)
    : supabase.from('routes').insert(input);
  const { data, error } = await q.select('*').single();
  if (error) throw error;
  return data as SavedRoute;
}

export async function deleteRoute(id: string): Promise<void> {
  const { error } = await supabase.from('routes').delete().eq('id', id);
  if (error) throw error;
}
