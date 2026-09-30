import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Medal, Gift } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { getLeaderboard, type LeaderRow, type Period } from '@/lib/gamification';
import { Chip, ChipRow } from '@/components/Chip';

const MEDALS = ['#EAB308', '#94A3B8', '#B45309'];

export function LeaderboardScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('week');
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await getLeaderboard(period)); } catch { setRows([]); } finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.root} testID="leaderboard-screen">
      <ChipRow testID="leaderboard-period-row">
        <Chip label={t('periodWeek')} active={period === 'week'} onPress={() => setPeriod('week')} testID="leaderboard-week" />
        <Chip label={t('periodMonth')} active={period === 'month'} onPress={() => setPeriod('month')} testID="leaderboard-month" />
        <Chip label={t('periodAll')} active={period === 'all'} onPress={() => setPeriod('all')} testID="leaderboard-all" />
      </ChipRow>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.note}><Gift size={16} color="#7C3AED" /><Text style={styles.noteText}>{t('rewardsNote')}</Text></View>
        {loading ? <ActivityIndicator color="#2D7FF9" style={{ marginTop: 24 }} /> : rows.length === 0 ? <Text style={styles.muted}>{t('noActivity')}</Text> : rows.map((r) => {
          const me = r.user_id === profile?.id;
          const name = r.display_name || r.username || '—';
          return (
            <TouchableOpacity key={r.user_id} style={[styles.row, me && styles.rowMe]} onPress={() => !me && navigate('userProfile', { userId: r.user_id })} testID={`leader-row-${r.rank}`}>
              <View style={styles.rank}>{r.rank <= 3 ? <Medal size={22} color={MEDALS[r.rank - 1]} /> : <Text style={styles.rankText}>{r.rank}</Text>}</View>
              {r.avatar_url ? <Image source={{ uri: r.avatar_url }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></View>}
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{name}{me ? ` (${t('you')})` : ''}</Text>
                <Text style={styles.meta}>{t('level')} {r.level}</Text>
              </View>
              <Text style={styles.xp}>{Number(r.xp).toLocaleString()} XP</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingHorizontal: 16, gap: 8 },
  note: { flexDirection: 'row', gap: 8, backgroundColor: '#F5F3FF', borderRadius: 14, padding: 12, alignItems: 'center' },
  noteText: { flex: 1, fontSize: 12, color: '#5B21B6' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12 },
  rowMe: { borderWidth: 2, borderColor: '#2D7FF9' },
  rank: { width: 28, alignItems: 'center' },
  rankText: { fontSize: 15, fontWeight: '800', color: '#6B7280' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF9F43', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  meta: { fontSize: 12, color: '#6B7280' },
  xp: { fontSize: 14, fontWeight: '900', color: '#1F2937' },
  muted: { textAlign: 'center', color: '#6B7280', marginTop: 24 },
});
