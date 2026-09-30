import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { listActivities, listXpRules, type Activity, type XpRule } from '@/lib/gamification';

const PAGE = 30;

export function ActivityScreen() {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Activity[]>([]);
  const [rules, setRules] = useState<Record<string, XpRule>>({});
  const [loading, setLoading] = useState(true);
  const [end, setEnd] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [a, r] = await Promise.all([listActivities(profile.id, 0, PAGE), listXpRules()]);
      setItems(a); setEnd(a.length < PAGE);
      setRules(Object.fromEntries(r.map((x) => [x.type, x])));
    } catch {} finally { setLoading(false); }
  }, [profile?.id]);
  useEffect(() => { load(); }, [load]);

  const more = async () => {
    if (!profile?.id || busy.current || end) return;
    busy.current = true; setLoadingMore(true);
    try { const a = await listActivities(profile.id, items.length, PAGE); setItems((p) => [...p, ...a]); if (a.length < PAGE) setEnd(true); }
    catch {} finally { busy.current = false; setLoadingMore(false); }
  };

  const label = (a: Activity) => {
    if (a.type === 'achievement') return `${t('actAchievement')}: ${language === 'pl' ? a.meta?.name_pl : a.meta?.name_en}`;
    if (a.type === 'mission') return `${t('actMission')}: ${language === 'pl' ? a.meta?.name_pl : a.meta?.name_en}`;
    const r = rules[a.type];
    const base = r ? (language === 'pl' ? r.label_pl : r.label_en) : a.type;
    return a.meta?.title ? `${base}: ${a.meta.title}` : base;
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]} testID="activity-screen"
      onScroll={(e) => { const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent; if (contentOffset.y + layoutMeasurement.height > contentSize.height - 400) more(); }} scrollEventThrottle={150}>
      {items.length === 0 ? <Text style={styles.muted} testID="activity-empty">{t('noActivity')}</Text> : items.map((a) => (
        <View key={a.id} style={styles.row} testID={`activity-${a.id}`}>
          <View style={[styles.icon, a.type === 'achievement' && { backgroundColor: '#FEF3C7' }, a.type === 'mission' && { backgroundColor: '#FFEDD5' }]}><Zap size={16} color="#F59E0B" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label} numberOfLines={2}>{label(a)}</Text>
            <Text style={styles.date}>{new Date(a.created_at).toLocaleString()}</Text>
          </View>
          <Text style={styles.xp}>+{a.xp} XP</Text>
        </View>
      ))}
      {loadingMore && <ActivityIndicator color="#2D7FF9" style={{ marginVertical: 12 }} />}
      {!end && !loadingMore && items.length > 0 && (
        <TouchableOpacity style={styles.more} onPress={more} testID="activity-load-more"><Text style={styles.moreText}>{t('loadMore')}</Text></TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12 },
  icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  date: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  xp: { fontSize: 13, fontWeight: '800', color: '#10B981' },
  muted: { textAlign: 'center', color: '#6B7280', marginTop: 24 },
  more: { alignSelf: 'center', marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 24, height: 44, justifyContent: 'center', borderRadius: 999 },
  moreText: { fontSize: 14, fontWeight: '700', color: '#2D7FF9' },
});
