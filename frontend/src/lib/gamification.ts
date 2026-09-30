import { supabase } from './supabase';

export type Tier = 'bronze' | 'silver' | 'gold';

export interface Stats {
  pins: number; visited_places: number; cities: number; countries: number; photos: number; boards: number;
  saved_pins: number; likes_given: number; likes_received: number; followers: number; following: number;
  routes: number; events_created: number; events_joined: number; checkins: number;
}

interface Localized { name_pl: string; name_en: string; desc_pl: string; desc_en: string; }

export interface Achievement extends Localized {
  code: string; metric: keyof Stats; threshold: number; tier: Tier; icon: string; xp: number; unlocked_at: string | null;
}

export interface Mission extends Localized {
  code: string; type: string; target: number; xp: number; period: 'once' | 'weekly'; icon: string; progress: number; claimed: boolean;
}

export interface Progress {
  xp: number; level: number; level_xp: number; next_level_xp: number;
  stats: Stats; achievements: Achievement[]; missions: Mission[];
}

export interface Activity {
  id: string; user_id: string; type: string; xp: number; ref_id: string; meta: Record<string, any>; created_at: string;
}

export interface LeaderRow {
  user_id: string; display_name: string | null; username: string | null; avatar_url: string | null; xp: number; level: number; rank: number;
}

export interface XpRule { type: string; xp: number; label_pl: string; label_en: string; }

export type Period = 'week' | 'month' | 'all';

/** XP needed to reach level L = 50·L·(L−1) — must match pom_level_for_xp() in SQL. */
export const xpForLevel = (level: number) => 50 * level * (level - 1);

export const loc = (o: { name_pl: string; name_en: string }, lang: string) => (lang === 'pl' ? o.name_pl : o.name_en);
export const locDesc = (o: { desc_pl: string; desc_en: string }, lang: string) => (lang === 'pl' ? o.desc_pl : o.desc_en);

export async function getProgress(): Promise<Progress> {
  const { data, error } = await supabase.rpc('pom_progress');
  if (error) throw error;
  return data as Progress;
}

export async function claimMission(code: string): Promise<Progress> {
  const { data, error } = await supabase.rpc('pom_claim_mission', { p_code: code });
  if (error) throw error;
  return data as Progress;
}

export async function getLeaderboard(period: Period, limit = 50): Promise<LeaderRow[]> {
  const { data, error } = await supabase.rpc('pom_leaderboard', { p_period: period, p_limit: limit });
  if (error) throw error;
  return (data ?? []) as LeaderRow[];
}

export async function listActivities(userId: string, offset = 0, limit = 30): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities').select('*').eq('user_id', userId)
    .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as Activity[];
}

export async function listXpRules(): Promise<XpRule[]> {
  const { data, error } = await supabase.from('xp_rules').select('*').order('sort');
  if (error) throw error;
  return (data ?? []) as XpRule[];
}

/** Public level/badge summary for any user (used on public profiles). */
export async function getPublicLevel(userId: string): Promise<{ xp: number; level: number; badges: number }> {
  const [p, b] = await Promise.all([
    supabase.from('profiles').select('xp,level').eq('id', userId).maybeSingle(),
    supabase.from('user_achievements').select('code', { count: 'exact', head: true }).eq('user_id', userId),
  ]);
  return { xp: (p.data as any)?.xp ?? 0, level: (p.data as any)?.level ?? 1, badges: b.count ?? 0 };
}
