import { supabase } from './supabase';
import type { Place } from './places';
import type { BBox } from './geo';

const SELECT = '*, place_photos(url)';
export const MAX_GEO_RESULTS = 1000;

/** Categories are stored as the localized label chosen at creation time — match both languages. */
export const CATEGORY_GROUPS: { key: string; labels: string[] }[] = [
  { key: 'categoryNature', labels: ['Natura', 'Nature'] },
  { key: 'categoryRestaurant', labels: ['Restauracja', 'Restaurant'] },
  { key: 'categoryMonument', labels: ['Zabytek', 'Monument'] },
  { key: 'categoryBeach', labels: ['Plaża', 'Beach'] },
  { key: 'categoryHotel', labels: ['Hotel'] },
  { key: 'categoryCity', labels: ['Miasto', 'City'] },
  { key: 'categoryOther', labels: ['Inne', 'Other'] },
];

const clean = (q: string) => q.replace(/[,()%*]/g, ' ').trim();

/** Places inside a bounding box (uses the (latitude, longitude) index). */
export async function placesInBBox(b: BBox, opts: { categories?: string[]; limit?: number } = {}): Promise<Place[]> {
  let q = supabase
    .from('places')
    .select(SELECT)
    .gte('latitude', b.south).lte('latitude', b.north)
    .gte('longitude', b.west).lte('longitude', b.east)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? MAX_GEO_RESULTS);
  if (opts.categories?.length) q = q.in('category', opts.categories);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Place[];
}

export type SearchMode = 'name' | 'location';

export async function searchPlaces(opts: {
  query: string;
  mode: SearchMode;
  categories?: string[];
  offset?: number;
  limit?: number;
}): Promise<Place[]> {
  const { mode, categories, offset = 0, limit = 30 } = opts;
  const q = clean(opts.query);
  let query = supabase.from('places').select(SELECT).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (q) {
    query = mode === 'name'
      ? query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      : query.or(`city.ilike.%${q}%,country.ilike.%${q}%`);
  }
  if (categories?.length) query = query.in('category', categories);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Place[];
}

/** User interests = categories they pin most often (top 3). */
export async function topCategories(userId: string): Promise<string[]> {
  const { data } = await supabase.from('places').select('category').eq('user_id', userId).limit(1000);
  const counts: Record<string, number> = {};
  (data ?? []).forEach((r: any) => {
    const group = CATEGORY_GROUPS.find((g) => g.labels.includes(r.category));
    if (group) counts[group.key] = (counts[group.key] ?? 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
}

/** Place ids the user owns or collected on any of their boards (incl. private ones). */
export async function myPlaceIds(userId: string): Promise<Set<string>> {
  const [own, pinned] = await Promise.all([
    supabase.from('places').select('id').eq('user_id', userId).limit(5000),
    supabase.from('board_pins').select('place_id').eq('user_id', userId).limit(5000),
  ]);
  const ids = new Set<string>();
  (own.data ?? []).forEach((r: any) => ids.add(r.id));
  (pinned.data ?? []).forEach((r: any) => ids.add(r.place_id));
  return ids;
}
