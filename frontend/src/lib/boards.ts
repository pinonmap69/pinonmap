import { supabase } from './supabase';
import type { Place } from './places';

export type BoardVisibility = 'public' | 'private' | 'premium';

export interface Board {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  visibility: BoardVisibility;
  is_default: boolean;
  source_board_id?: string | null;
  created_at: string;
}

export interface BoardOverview extends Board {
  count: number;
  cover: string | null;
}

export async function listBoards(userId: string): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Board[];
}

/** Boards for a user + pin count + a cover image (one extra query, grouped client-side). */
export async function boardsOverview(userId: string): Promise<BoardOverview[]> {
  const boards = await listBoards(userId);
  if (!boards.length) return [];
  const ids = boards.map((b) => b.id);
  const { data } = await supabase.from('board_pins').select('board_id, place:places(cover_url)').in('board_id', ids);
  const agg: Record<string, { count: number; cover: string | null }> = {};
  (data ?? []).forEach((r: any) => {
    const a = (agg[r.board_id] = agg[r.board_id] || { count: 0, cover: null });
    a.count += 1;
    if (!a.cover && r.place?.cover_url) a.cover = r.place.cover_url;
  });
  return boards.map((b) => ({ ...b, count: agg[b.id]?.count ?? 0, cover: b.cover_url ?? agg[b.id]?.cover ?? null }));
}

export async function getBoard(id: string): Promise<Board | null> {
  const { data, error } = await supabase.from('boards').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Board | null;
}

export async function createBoard(input: {
  user_id: string;
  name: string;
  description?: string;
  visibility?: BoardVisibility;
}): Promise<Board> {
  const { data, error } = await supabase
    .from('boards')
    .insert({ visibility: 'public', ...input })
    .select('*')
    .single();
  if (error) throw error;
  return data as Board;
}

export async function deleteBoard(id: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', id);
  if (error) throw error;
}

/** Add ANY place to a board — for one's own pins or repinning others' pins. */
export async function addPinToBoard(boardId: string, placeId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('board_pins')
    .upsert({ board_id: boardId, place_id: placeId, user_id: userId }, { onConflict: 'board_id,place_id' });
  if (error) throw error;
}

export async function removePinFromBoard(boardId: string, placeId: string): Promise<void> {
  const { error } = await supabase.from('board_pins').delete().eq('board_id', boardId).eq('place_id', placeId);
  if (error) throw error;
}

export async function listBoardPlaces(boardId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from('board_pins')
    .select('place:places(*, place_photos(url))')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => r.place).filter(Boolean) as Place[];
}

/** Public boards from other users (discovery). */
export async function listPublicBoards(excludeUserId?: string, limit = 50): Promise<BoardOverview[]> {
  let q = supabase.from('boards').select('*').eq('visibility', 'public').order('created_at', { ascending: false }).limit(limit);
  if (excludeUserId) q = q.neq('user_id', excludeUserId);
  const { data, error } = await q;
  if (error) throw error;
  const boards = (data ?? []) as Board[];
  if (!boards.length) return [];
  const ids = boards.map((b) => b.id);
  const { data: pins } = await supabase.from('board_pins').select('board_id, place:places(cover_url)').in('board_id', ids);
  const agg: Record<string, { count: number; cover: string | null }> = {};
  (pins ?? []).forEach((r: any) => {
    const a = (agg[r.board_id] = agg[r.board_id] || { count: 0, cover: null });
    a.count += 1;
    if (!a.cover && r.place?.cover_url) a.cover = r.place.cover_url;
  });
  return boards.map((b) => ({ ...b, count: agg[b.id]?.count ?? 0, cover: b.cover_url ?? agg[b.id]?.cover ?? null }));
}

/** "Pin a whole board": copy another user's board (and all its pins) into your own boards. */
export async function copyBoard(sourceId: string, userId: string): Promise<Board> {
  const source = await getBoard(sourceId);
  if (!source) throw new Error('Board not found');
  const { data: pins, error } = await supabase.from('board_pins').select('place_id').eq('board_id', sourceId).limit(5000);
  if (error) throw error;
  const { data, error: e2 } = await supabase
    .from('boards')
    .insert({ user_id: userId, name: source.name, description: source.description, visibility: 'public', source_board_id: source.id })
    .select('*')
    .single();
  if (e2) throw e2;
  const board = data as Board;
  const rows = (pins ?? []).map((p: any) => ({ board_id: board.id, place_id: p.place_id, user_id: userId }));
  if (rows.length) {
    const { error: e3 } = await supabase.from('board_pins').insert(rows);
    if (e3) throw e3;
  }
  return board;
}

/** Create a board from a list of place ids in one go (used by routes & area search). */
export async function createBoardWithPlaces(userId: string, name: string, placeIds: string[], visibility: BoardVisibility = 'private'): Promise<Board> {
  const board = await createBoard({ user_id: userId, name, visibility });
  const rows = Array.from(new Set(placeIds)).map((place_id) => ({ board_id: board.id, place_id, user_id: userId }));
  if (rows.length) {
    const { error } = await supabase.from('board_pins').insert(rows);
    if (error) throw error;
  }
  return board;
}
