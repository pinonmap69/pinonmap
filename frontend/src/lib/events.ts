import { supabase } from './supabase';

export interface PomEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  starts_at: string;
  ends_at: string;
  checkin_radius_m: number;
  cover_url: string | null;
  created_at: string;
  event_attendees?: { count: number }[];
}

export type EventInput = Pick<PomEvent, 'user_id' | 'title' | 'description' | 'category' | 'latitude' | 'longitude' | 'address' | 'starts_at' | 'ends_at'>;

const SELECT = '*, event_attendees(count)';

export const attendeeCount = (e: PomEvent) => e.event_attendees?.[0]?.count ?? 0;

export function eventState(e: PomEvent, now = Date.now()): 'upcoming' | 'live' | 'past' {
  const s = new Date(e.starts_at).getTime();
  const en = new Date(e.ends_at).getTime();
  if (now < s) return 'upcoming';
  if (now > en) return 'past';
  return 'live';
}

export async function listEvents(opts: { scope: 'upcoming' | 'mine' | 'past'; userId?: string; offset?: number; limit?: number }): Promise<PomEvent[]> {
  const { scope, userId, offset = 0, limit = 30 } = opts;
  const nowIso = new Date().toISOString();
  let q = supabase.from('events').select(SELECT);
  if (scope === 'upcoming') q = q.gte('ends_at', nowIso).order('starts_at', { ascending: true });
  if (scope === 'past') q = q.lt('ends_at', nowIso).order('starts_at', { ascending: false });
  if (scope === 'mine') {
    const { data: att } = await supabase.from('event_attendees').select('event_id').eq('user_id', userId ?? '');
    const ids = (att ?? []).map((a: any) => a.event_id);
    q = q.or(`user_id.eq.${userId},id.in.(${ids.length ? ids.join(',') : '00000000-0000-0000-0000-000000000000'})`).order('starts_at', { ascending: false });
  }
  const { data, error } = await q.range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as PomEvent[];
}

export async function getEvent(id: string): Promise<PomEvent | null> {
  const { data, error } = await supabase.from('events').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as PomEvent | null;
}

export async function createEvent(input: EventInput): Promise<PomEvent> {
  const { data, error } = await supabase.from('events').insert(input).select('*').single();
  if (error) throw error;
  return data as PomEvent;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

export async function myAttendance(eventId: string, userId: string): Promise<{ joined: boolean; checkedIn: boolean }> {
  const { data } = await supabase.from('event_attendees').select('checked_in_at').eq('event_id', eventId).eq('user_id', userId).maybeSingle();
  return { joined: !!data, checkedIn: !!(data as any)?.checked_in_at };
}

export async function joinEvent(eventId: string, userId: string) {
  const { error } = await supabase.from('event_attendees').insert({ event_id: eventId, user_id: userId });
  if (error && error.code !== '23505') throw error;
}

export async function leaveEvent(eventId: string, userId: string) {
  const { error } = await supabase.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', userId);
  if (error) throw error;
}

export async function checkIn(eventId: string, lat: number, lng: number): Promise<{ ok: boolean; reason?: string; distance_m?: number }> {
  const { data, error } = await supabase.rpc('pom_event_checkin', { p_event: eventId, p_lat: lat, p_lng: lng });
  if (error) throw error;
  return data as any;
}
