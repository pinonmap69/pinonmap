// Etap 6A — opening shared content inside the app.
// Supported: pinonmap://place/<id>, exp://…/--/board/<id> (Expo Go), https://…/api/share/route/<id>,
// and the web app with ?open=event/<id> (fallback button on the share landing page).
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import type { Screen, NavParams } from '@/types';

const TARGET: Record<string, { screen: Screen; param: string }> = {
  place: { screen: 'placeDetail', param: 'placeId' },
  board: { screen: 'boardDetail', param: 'boardId' },
  route: { screen: 'routePlanner', param: 'routeId' },
  event: { screen: 'eventDetail', param: 'eventId' },
  user: { screen: 'userProfile', param: 'userId' },
};

export function parseContentLink(url: string | null): { screen: Screen; params: NavParams } | null {
  if (!url) return null;
  let candidate = url;
  try {
    const parsed = Linking.parse(url);
    const open = parsed.queryParams?.open;
    if (typeof open === 'string') candidate = open;
    else candidate = [parsed.hostname, parsed.path].filter(Boolean).join('/');
  } catch {}
  const m = candidate.match(/(?:^|\/)(place|board|route|event|user)\/([0-9a-f-]{36})/i);
  if (!m) return null;
  const tgt = TARGET[m[1].toLowerCase()];
  return { screen: tgt.screen, params: { [tgt.param]: m[2] } };
}

export function useDeepLinks(navigate: (screen: Screen, params?: NavParams) => void) {
  useEffect(() => {
    const handle = (url: string | null) => {
      const link = parseContentLink(url);
      if (!link) return;
      navigate(link.screen, link.params);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.search.includes('open=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener('url', (e) => handle(e.url));
    return () => sub.remove();
  }, [navigate]);
}
