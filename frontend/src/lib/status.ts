import type { TranslationKey } from '@/providers/LanguageProvider';

export type PlaceStatus = 'want_to_visit' | 'visited' | 'visit_again' | 'been_here';

export const PLACE_STATUSES: PlaceStatus[] = [
  'want_to_visit',
  'visited',
  'visit_again',
  'been_here',
];

export const STATUS_COLORS: Record<PlaceStatus, string> = {
  want_to_visit: '#FF9F43',
  visited: '#3EC7B8',
  visit_again: '#A855F7',
  been_here: '#2D7FF9',
};

export const STATUS_TKEY: Record<PlaceStatus, TranslationKey> = {
  want_to_visit: 'statusWantToVisit',
  visited: 'statusVisited',
  visit_again: 'statusVisitAgain',
  been_here: 'statusBeenHere',
};

export function statusColor(status?: string | null): string {
  return STATUS_COLORS[(status as PlaceStatus) ?? 'want_to_visit'] ?? '#2D7FF9';
}
