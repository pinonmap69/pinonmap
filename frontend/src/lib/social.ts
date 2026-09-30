import { supabase } from './supabase';

// ---------- LIKES ----------
export async function listLikedPlaceIds(userId: string): Promise<Set<string>> {
  try {
    const { data, error } = await supabase.from('likes').select('place_id').eq('user_id', userId);
    if (error) throw error;
    return new Set((data ?? []).map((r: any) => r.place_id));
  } catch {
    return new Set();
  }
}

export async function toggleLike(userId: string, placeId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase.from('likes').delete().eq('user_id', userId).eq('place_id', placeId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('likes').insert({ user_id: userId, place_id: placeId });
    if (error) throw error;
  }
}

export async function countLikes(placeId: string): Promise<number> {
  try {
    const { count, error } = await supabase.from('likes').select('id', { count: 'exact', head: true }).eq('place_id', placeId);
    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ---------- FOLLOWS ----------
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  try {
    const { data } = await supabase.from('follows').select('id').eq('follower_id', followerId).eq('following_id', followingId).maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function toggleFollow(followerId: string, followingId: string, following: boolean): Promise<void> {
  if (following) {
    const { error } = await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  }
}

export async function countFollowers(userId: string): Promise<number> {
  try {
    const { count } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function countFollowing(userId: string): Promise<number> {
  try {
    const { count } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId);
    return count ?? 0;
  } catch {
    return 0;
  }
}
