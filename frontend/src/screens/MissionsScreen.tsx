import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/providers/LanguageProvider';
import { getProgress, claimMission, loc, locDesc, type Mission } from '@/lib/gamification';
import { iconFor, ProgressBar } from '@/components/Gamification';

export function MissionsScreen() {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const p = await getProgress(); setMissions(p.missions); setXp(p.xp); } catch (e: any) { setError(e?.message ?? 'Error'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const claim = async (m: Mission) => {
    setClaiming(m.code); setError(null);
    try {
      const p = await claimMission(m.code);
      setMissions(p.missions); setXp(p.xp);
      setMsg(`+${m.xp} XP · ${loc(m, language)}`); setTimeout(() => setMsg(null), 2800);
    } catch (e: any) { setError(e?.message ?? 'Error'); }
    finally { setClaiming(null); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>;

  const sorted = [...missions].sort((a, b) => {
    const score = (m: Mission) => (m.claimed ? 2 : m.progress >= m.target ? 0 : 1);
    return score(a) - score(b);
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]} testID="missions-screen">
      <View style={styles.head}>
        <Text style={styles.sub}>{t('missionsSub')}</Text>
        <Text style={styles.xp} testID="missions-xp">{xp.toLocaleString()} XP</Text>
      </View>
      {msg && <View style={styles.okBox} testID="mission-claimed-msg"><Check size={14} color="#0F766E" /><Text style={styles.okText}>{msg}</Text></View>}
      {error && <Text style={styles.error}>{error}</Text>}
      {sorted.map((m) => {
        const Icon = iconFor(m.icon);
        const done = m.progress >= m.target;
        return (
          <View key={m.code} style={[styles.card, m.claimed && styles.cardClaimed]} testID={`mission-${m.code}`}>
            <View style={[styles.icon, { backgroundColor: m.claimed ? '#E5E7EB' : done ? '#FEF3C7' : '#EFF6FF' }]}>
              <Icon size={20} color={m.claimed ? '#9CA3AF' : done ? '#B45309' : '#2D7FF9'} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>{loc(m, language)}</Text>
                <View style={[styles.tag, m.period === 'weekly' && styles.tagWeekly]}><Text style={[styles.tagText, m.period === 'weekly' && { color: '#7C3AED' }]}>{m.period === 'weekly' ? t('weekly') : t('oneTime')}</Text></View>
              </View>
              <Text style={styles.desc}>{locDesc(m, language)}</Text>
              <View style={styles.progRow}>
                <View style={{ flex: 1 }}><ProgressBar value={Math.min(m.progress, m.target)} max={m.target} color={done ? '#F59E0B' : '#2D7FF9'} height={6} /></View>
                <Text style={styles.progText}>{Math.min(m.progress, m.target)}/{m.target}</Text>
              </View>
            </View>
            {m.claimed ? (
              <View style={styles.claimedPill}><Check size={14} color="#6B7280" /><Text style={styles.claimedText}>{t('claimed')}</Text></View>
            ) : (
              <TouchableOpacity style={[styles.claimBtn, !done && styles.claimBtnDisabled]} disabled={!done || claiming === m.code} onPress={() => claim(m)} testID={`mission-claim-${m.code}`}>
                {claiming === m.code ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.claimText}>{done ? t('claim') : `+${m.xp}`}</Text>}
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sub: { fontSize: 14, color: '#6B7280', flex: 1 },
  xp: { fontSize: 16, fontWeight: '900', color: '#1F2937' },
  okBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#CCFBF1', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  okText: { color: '#0F766E', fontWeight: '700', fontSize: 13 },
  error: { color: '#DC2626' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14 },
  cardClaimed: { opacity: 0.6 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '800', color: '#1F2937', flexShrink: 1 },
  tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagWeekly: { backgroundColor: '#EDE9FE' },
  tagText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  desc: { fontSize: 12, color: '#6B7280' },
  progRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progText: { fontSize: 11, color: '#6B7280', fontWeight: '700' },
  claimBtn: { minWidth: 72, height: 40, borderRadius: 12, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  claimBtnDisabled: { backgroundColor: '#CBD5E1' },
  claimText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  claimedPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  claimedText: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
});
