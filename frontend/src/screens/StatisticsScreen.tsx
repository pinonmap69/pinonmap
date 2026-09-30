import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Target, Medal, History, Info, MapPin, Globe, Building2, Camera, LayoutGrid, Users, Heart, Route, CalendarCheck, Footprints, ChevronRight, BadgeCheck, Bookmark } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '@/navigation/nav';
import { useLanguage, type TranslationKey } from '@/providers/LanguageProvider';
import { getProgress, loc, locDesc, type Progress, type Stats } from '@/lib/gamification';
import { Badge, ProgressBar, TIER_COLORS } from '@/components/Gamification';

const STAT_TILES: { key: keyof Stats; label: TranslationKey; icon: any; color: string }[] = [
  { key: 'visited_places', label: 'statVisited', icon: Footprints, color: '#3EC7B8' },
  { key: 'cities', label: 'cities', icon: Building2, color: '#6366F1' },
  { key: 'countries', label: 'countries', icon: Globe, color: '#2D7FF9' },
  { key: 'pins', label: 'pins', icon: MapPin, color: '#FF9F43' },
  { key: 'photos', label: 'statPhotos', icon: Camera, color: '#EC4899' },
  { key: 'boards', label: 'statBoards', icon: LayoutGrid, color: '#0EA5E9' },
  { key: 'followers', label: 'statFollowers', icon: Users, color: '#10B981' },
  { key: 'likes_received', label: 'statLikes', icon: Heart, color: '#EF4444' },
  { key: 'routes', label: 'statRoutes', icon: Route, color: '#8B5CF6' },
  { key: 'events_joined', label: 'statEvents', icon: CalendarCheck, color: '#F97316' },
  { key: 'checkins', label: 'checkedIn', icon: BadgeCheck, color: '#0F766E' },
  { key: 'saved_pins', label: 'saveToBoard', icon: Bookmark, color: '#A855F7' },
];

/** Etap 5 hub: level + XP, travel statistics, badges and links to missions / ranking / history. */
export function StatisticsScreen() {
  const { navigate } = useNav();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setData(await getProgress()); setError(null); }
    catch (e: any) { setError(e?.message ?? 'Error'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>;
  if (!data) return <View style={styles.center}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={load} style={styles.retry}><Text style={styles.retryText}>{t('tryAgain')}</Text></TouchableOpacity></View>;

  const inLevel = data.xp - data.level_xp;
  const levelSpan = data.next_level_xp - data.level_xp;
  const unlocked = data.achievements.filter((a) => a.unlocked_at).length;
  const claimable = data.missions.filter((m) => !m.claimed && m.progress >= m.target).length;
  const links = [
    { id: 'missions', label: t('missions'), icon: Target, color: '#F97316', screen: 'missions' as const, badge: claimable },
    { id: 'leaderboard', label: t('leaderboard'), icon: Medal, color: '#EAB308', screen: 'leaderboard' as const, badge: 0 },
    { id: 'activity', label: t('activityHistory'), icon: History, color: '#6366F1', screen: 'activity' as const, badge: 0 },
    { id: 'xpRules', label: t('xpRules'), icon: Info, color: '#0EA5E9', screen: 'xpRules' as const, badge: 0 },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />} testID="progress-screen">
      <View style={styles.levelCard} testID="level-card">
        <View style={styles.levelRow}>
          <View style={styles.levelCircle}><Text style={styles.levelNum} testID="level-value">{data.level}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.levelLabel}>{t('level')} {data.level}</Text>
            <Text style={styles.xpText} testID="xp-value">{data.xp.toLocaleString()} XP</Text>
          </View>
        </View>
        <ProgressBar value={inLevel} max={levelSpan} color="#FCD34D" height={10} testID="level-progress" />
        <Text style={styles.nextText}>{(data.next_level_xp - data.xp).toLocaleString()} {t('xpToNext')} ({data.level + 1})</Text>
      </View>

      <View style={styles.links}>
        {links.map((l) => (
          <TouchableOpacity key={l.id} style={styles.link} onPress={() => navigate(l.screen)} testID={`progress-link-${l.id}`}>
            <View style={[styles.linkIcon, { backgroundColor: l.color }]}><l.icon size={18} color="#fff" /></View>
            <Text style={styles.linkText} numberOfLines={2}>{l.label}</Text>
            {l.badge > 0 && <View style={styles.dot}><Text style={styles.dotText}>{l.badge}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t('travelStats')}</Text>
      <View style={styles.statsGrid}>
        {STAT_TILES.map((s) => (
          <View key={s.key} style={styles.stat} testID={`stat-${s.key}`}>
            <s.icon size={18} color={s.color} />
            <Text style={styles.statValue}>{data.stats[s.key] ?? 0}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>{t(s.label)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{t('achievementsTitle')}</Text>
        <Text style={styles.sectionMeta} testID="badges-count">{unlocked}/{data.achievements.length} {t('unlocked')}</Text>
      </View>
      <View style={styles.badges}>
        {data.achievements.map((a) => {
          const value = Math.min(data.stats[a.metric] ?? 0, a.threshold);
          const isUnlocked = !!a.unlocked_at;
          return (
            <View key={a.code} style={styles.badgeCell} testID={`achievement-${a.code}`}>
              <Badge icon={a.icon} tier={a.tier} unlocked={isUnlocked} />
              <Text style={[styles.badgeName, !isUnlocked && styles.muted]} numberOfLines={2}>{loc(a, language)}</Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>{locDesc(a, language)}</Text>
              {isUnlocked
                ? <Text style={[styles.badgeXp, { color: TIER_COLORS[a.tier].fg }]}>+{a.xp} XP</Text>
                : <View style={styles.badgeBar}><ProgressBar value={value} max={a.threshold} height={4} /><Text style={styles.badgeProg}>{value}/{a.threshold}</Text></View>}
            </View>
          );
        })}
      </View>
      <TouchableOpacity style={styles.eventsRow} onPress={() => navigate('events')} testID="progress-events-btn">
        <CalendarCheck size={18} color="#F97316" /><Text style={styles.eventsText}>{t('events')}</Text><ChevronRight size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', gap: 12, padding: 24 },
  error: { color: '#DC2626', textAlign: 'center' },
  retry: { height: 44, paddingHorizontal: 20, borderRadius: 999, backgroundColor: '#2D7FF9', justifyContent: 'center' },
  retryText: { color: '#fff', fontWeight: '700' },
  levelCard: { backgroundColor: '#1F2937', borderRadius: 24, padding: 20, gap: 12 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  levelCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FCD34D', alignItems: 'center', justifyContent: 'center' },
  levelNum: { fontSize: 28, fontWeight: '900', color: '#1F2937' },
  levelLabel: { color: '#9CA3AF', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  xpText: { color: '#fff', fontSize: 26, fontWeight: '900' },
  nextText: { color: '#D1D5DB', fontSize: 12 },
  links: { flexDirection: 'row', gap: 8 },
  link: { flex: 1, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', gap: 6, minHeight: 92 },
  linkIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontSize: 11, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  dot: { position: 'absolute', top: 6, right: 6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  dotText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginTop: 8 },
  sectionMeta: { fontSize: 12, color: '#6B7280', fontWeight: '700', marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '22%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 12, alignItems: 'center', gap: 4, minWidth: 60 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  statLabel: { fontSize: 10, color: '#6B7280', paddingHorizontal: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeCell: { width: '31%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 18, padding: 10, alignItems: 'center', gap: 4 },
  badgeName: { fontSize: 12, fontWeight: '800', color: '#1F2937', textAlign: 'center' },
  badgeDesc: { fontSize: 10, color: '#6B7280', textAlign: 'center' },
  badgeXp: { fontSize: 11, fontWeight: '800' },
  badgeBar: { width: '100%', gap: 2, alignItems: 'center' },
  badgeProg: { fontSize: 10, color: '#9CA3AF', fontWeight: '700' },
  muted: { color: '#9CA3AF' },
  eventsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 18, padding: 14, marginTop: 8 },
  eventsText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1F2937' },
});
