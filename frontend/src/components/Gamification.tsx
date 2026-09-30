import { View, Text, StyleSheet } from 'react-native';
import {
  MapPin, MapPinned, Trophy, Footprints, Backpack, Globe, Building2, Landmark, Flag, Earth, Crown, Camera, LayoutGrid,
  Users, Heart, Route, CalendarCheck, BadgeCheck, Bookmark, UserPlus, CalendarPlus, CalendarDays, Sparkles, Award, Lock, Share2,
  type LucideIcon,
} from 'lucide-react-native';
import type { Tier } from '@/lib/gamification';

const ICONS: Record<string, LucideIcon> = {
  MapPin, MapPinned, Trophy, Footprints, Backpack, Globe, Building2, Landmark, Flag, Earth, Crown, Camera, LayoutGrid,
  Users, Heart, Route, CalendarCheck, BadgeCheck, Bookmark, UserPlus, CalendarPlus, CalendarDays, Sparkles, Share2,
};

export const iconFor = (name: string): LucideIcon => ICONS[name] ?? Award;

export const TIER_COLORS: Record<Tier, { bg: string; fg: string; ring: string }> = {
  bronze: { bg: '#FDE7D3', fg: '#B45309', ring: '#F59E0B' },
  silver: { bg: '#E5E7EB', fg: '#475569', ring: '#94A3B8' },
  gold: { bg: '#FEF3C7', fg: '#B45309', ring: '#EAB308' },
};

/** Round badge for an achievement; greyed + lock when not unlocked. */
export function Badge({ icon, tier, unlocked, size = 56 }: { icon: string; tier: Tier; unlocked: boolean; size?: number }) {
  const Icon = iconFor(icon);
  const c = TIER_COLORS[tier];
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: unlocked ? c.bg : '#F3F4F6', borderColor: unlocked ? c.ring : '#E5E7EB' }]}>
      <Icon size={size * 0.42} color={unlocked ? c.fg : '#CBD5E1'} />
      {!unlocked && <View style={styles.lock}><Lock size={10} color="#fff" /></View>}
    </View>
  );
}

export function ProgressBar({ value, max, color = '#2D7FF9', height = 8, testID }: { value: number; max: number; color?: string; height?: number; testID?: string }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]} testID={testID}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

export function LevelPill({ level, testID }: { level: number; testID?: string }) {
  return (
    <View style={styles.pill} testID={testID}>
      <Trophy size={12} color="#fff" />
      <Text style={styles.pillText}>LVL {level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  lock: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#94A3B8', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  track: { width: '100%', backgroundColor: '#E5E7EB', overflow: 'hidden' },
  fill: { height: '100%' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1F2937', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
