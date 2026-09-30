import { supabase } from './supabase';

export type BoardVisibility = 'public' | 'private' | 'premium';

export interface Board {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  visibility: BoardVisibility;
  is_default: boolean;
  created_at: string;
}

/** Structure prepared for Etap 3 (tablice). Basic helpers ready for later UI. */
export async function listBoards(userId: string): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Board[];
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

export async function addPinToBoard(boardId: string, placeId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('board_pins')
    .upsert({ board_id: boardId, place_id: placeId, user_id: userId }, { onConflict: 'board_id,place_id' });
  if (error) throw error;
}
