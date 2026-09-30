// Etap 6A — sharing architecture.
// A ShareTarget describes one platform. Add a new messenger / social network by appending to SHARE_TARGETS.
import { Platform, Share, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

export type ShareKind = 'place' | 'board' | 'route' | 'event' | 'user';

export interface ShareContent {
  kind: ShareKind;
  id: string;
  title: string;
  text?: string;
  imageUrl?: string | null;
  lat?: number;
  lng?: number;
}

export interface ShareTarget {
  id: string;
  label: string;
  color: string;
  /** App deep link (tried first on iOS/Android). */
  native?: (msg: string, url: string) => string;
  /** Web fallback (also used when the app is not installed). */
  web?: (msg: string, url: string) => string | null;
  /** Shares the photo file through the OS sheet (Instagram / TikTok accept images, not links). */
  photo?: boolean;
  hideOnWeb?: boolean;
}

const enc = encodeURIComponent;
const FB_APP_ID = process.env.EXPO_PUBLIC_FB_APP_ID;

/** Public link: landing page with OG preview that opens the content in the app (or web fallback). */
export const shareUrl = (kind: ShareKind, id: string) => `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/share/${kind}/${id}`;

export const mapsUrl = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export function shareMessage(c: ShareContent): string {
  const parts = [c.title];
  if (c.text) parts.push(c.text);
  if (c.lat != null && c.lng != null) parts.push(`📍 ${mapsUrl(c.lat, c.lng)}`);
  parts.push(shareUrl(c.kind, c.id));
  return parts.join('\n');
}

export const SHARE_TARGETS: ShareTarget[] = [
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', native: (m) => `whatsapp://send?text=${enc(m)}`, web: (m) => `https://wa.me/?text=${enc(m)}` },
  {
    id: 'messenger', label: 'Messenger', color: '#0084FF',
    native: (_m, u) => `fb-messenger://share?link=${enc(u)}`,
    web: (_m, u) => (FB_APP_ID ? `https://www.facebook.com/dialog/send?app_id=${FB_APP_ID}&link=${enc(u)}&redirect_uri=${enc(u)}` : null),
  },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', web: (_m, u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` },
  { id: 'instagram', label: 'Instagram', color: '#E1306C', photo: true, hideOnWeb: true },
  { id: 'tiktok', label: 'TikTok', color: '#111111', photo: true, hideOnWeb: true },
  { id: 'telegram', label: 'Telegram', color: '#229ED9', native: (m, u) => `tg://msg_url?url=${enc(u)}&text=${enc(m)}`, web: (m, u) => `https://t.me/share/url?url=${enc(u)}&text=${enc(m)}` },
  { id: 'x', label: 'X', color: '#000000', web: (m, u) => `https://twitter.com/intent/tweet?text=${enc(m.replace(u, '').trim())}&url=${enc(u)}` },
  { id: 'sms', label: 'SMS', color: '#10B981', native: (m) => (Platform.OS === 'ios' ? `sms:&body=${enc(m)}` : `sms:?body=${enc(m)}`), hideOnWeb: true },
  { id: 'email', label: 'E-mail', color: '#6B7280', web: (m) => `mailto:?subject=${enc(m.split('\n')[0])}&body=${enc(m)}` },
];

export const visibleTargets = () => SHARE_TARGETS.filter((t) => !(Platform.OS === 'web' && t.hideOnWeb));

export type ShareResult = 'opened' | 'copied' | 'shared' | 'unavailable';

async function sharePhoto(c: ShareContent): Promise<ShareResult> {
  if (!c.imageUrl || !(await Sharing.isAvailableAsync())) return systemShare(c);
  const file = `${FileSystem.cacheDirectory}pom_share_${c.id}.jpg`;
  const { uri } = await FileSystem.downloadAsync(c.imageUrl, file);
  await Clipboard.setStringAsync(shareMessage(c)); // caption + link ready to paste in Instagram / TikTok
  await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: c.title, UTI: 'public.jpeg' });
  return 'shared';
}

export async function systemShare(c: ShareContent): Promise<ShareResult> {
  const url = shareUrl(c.kind, c.id);
  try {
    if (Platform.OS === 'web' && !(navigator as any)?.share) { await copyLink(c); return 'copied'; }
    await Share.share({ title: c.title, message: shareMessage(c), url });
    return 'shared';
  } catch {
    await copyLink(c);
    return 'copied';
  }
}

export async function copyLink(c: ShareContent) {
  await Clipboard.setStringAsync(shareUrl(c.kind, c.id));
}

/** Opens a platform; gracefully falls back when the app is missing (web link → copy link). */
export async function shareTo(target: ShareTarget, c: ShareContent): Promise<ShareResult> {
  void logShare(c, target.id);
  if (target.photo) {
    try { return await sharePhoto(c); } catch { return systemShare(c); }
  }
  const msg = shareMessage(c);
  const url = shareUrl(c.kind, c.id);
  if (Platform.OS !== 'web' && target.native) {
    try { await Linking.openURL(target.native(msg, url)); return 'opened'; } catch { /* app not installed */ }
  }
  const web = target.web?.(msg, url);
  if (web) {
    try { await Linking.openURL(web); return 'opened'; } catch { /* fall through */ }
  }
  await copyLink(c);
  return 'unavailable';
}

/** Analytics for creators / ads stages (table `shares`, optional — ignored if missing). */
export async function logShare(c: ShareContent, target: string) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from('shares').insert({ user_id: data.user.id, kind: c.kind, ref_id: c.id, target });
  } catch {}
}
